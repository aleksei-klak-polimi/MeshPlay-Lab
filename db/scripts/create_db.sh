#!/bin/bash
# create_db.sh
#
# Usage:
#   ./create_db.sh --env prod
#   ./create_db.sh --env dev
#   ./create_db.sh --env test
#
# Description:
#   Creates the database and applies the schema
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Stop on any error, and propagate pipeline errors
set -eE -o pipefail

# Load shared library
LIB_PATH="$(dirname "$0")/lib_common.sh"
if [ -f "$LIB_PATH" ]; then
  source "$LIB_PATH"
else
  echo "[ERROR] Shared library not found: $LIB_PATH"
  exit 1
fi


# Configuration
ENV_FILE="$SCRIPT_DIR/../.env"
SCHEMA_FILE="$SCRIPT_DIR/../init/init.sql"

# Validate .env
REQUIRED_VARS=(
  DB_HOST DB_PORT
  DB_PROD_NAME DB_DEV_NAME DB_TEST_NAME
  DB_ADMIN_USER DB_ADMIN_PASSWORD
  DB_PROD_USER DB_PROD_PASSWORD
  DB_DEV_USER DB_DEV_PASSWORD
  DB_TEST_USER DB_TEST_PASSWORD
  LOG_DIR
)

# Load and validate environment
load_env "$ENV_FILE"
validate_env_vars REQUIRED_VARS

# Parse arguments
parse_env_flag $1 $2

# Select environment-specific variables
if [[ "$TARGET_ENV" == "test" ]]; then
  DB_NAME="$DB_TEST_NAME"
  DB_APP_USER="$DB_TEST_USER"
  DB_APP_PASSWORD="$DB_TEST_PASSWORD"
elif [[ "$TARGET_ENV" == "dev" ]]; then
  DB_NAME="$DB_DEV_NAME"
  DB_APP_USER="$DB_DEV_USER"
  DB_APP_PASSWORD="$DB_DEV_PASSWORD"
elif [[ "$TARGET_ENV" == "prod" ]]; then
  DB_NAME="$DB_PROD_NAME"
  DB_APP_USER="$DB_PROD_USER"
  DB_APP_PASSWORD="$DB_PROD_PASSWORD"
fi

# Init logging
log_init "$SCRIPT_DIR/$LOG_DIR/" "$TARGET_ENV" "create"
log INFO "Running script for environment: $TARGET_ENV"

# Define reusable DB connection contexts
DB_CONN_ADMIN=("$DB_ADMIN_USER" "$DB_ADMIN_PASSWORD" "$DB_HOST" "$DB_PORT")

# Database Utilities
create_app_user() {
  local user="$1"
  local host="$2"
  local privileges="$3"

  log INFO "Creating user '$user'@'$host'"
  run_sql "${DB_CONN_ADMIN[@]}" "Create user $user@$host" <<EOF
CREATE USER IF NOT EXISTS '$user'@'$host' IDENTIFIED BY '$DB_APP_PASSWORD';
GRANT $privileges ON \`$DB_NAME\`.* TO '$user'@'$host';
FLUSH PRIVILEGES;
EOF
}

create_database() {
  log INFO "Creating database $DB_NAME"
  run_sql "${DB_CONN_ADMIN[@]}" "Create database $DB_NAME" <<EOF 
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`; 
EOF
}

apply_schema() {
  if [ -f "$SCHEMA_FILE" ]; then
    log INFO "Applying schema from $SCHEMA_FILE"
    if mariadb -u "$DB_ADMIN_USER" -p"$DB_ADMIN_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" < "$SCHEMA_FILE" 2>>"$LOG_FILE"; then
      log INFO "Applied init.sql schema successfully"
    else
      log ERROR "Failed applying init.sql (see $LOG_FILE)"
      exit 1
    fi
  else
    log ERROR "$SCHEMA_FILE not found!"
    exit 1
  fi
}

#Args Utility
flag_safety() {
  if [[ "$TARGET_ENV" == "prod" ]]; then
    log WARNING "You are about to create the PRODUCTION database."
    read -p "Type CONFIRM to continue: " CONFIRM
    if [ "$CONFIRM" != "CONFIRM" ]; then
      log INFO "Aborting operation."
      exit 1
    fi
  fi
}



# Main Script
log INFO "=== Starting database setup ==="

# Check if flag is prod
flag_safety

db_check_connection "${DB_CONN_ADMIN[@]}"

# Database setup
log INFO "Checking if Database $DB_NAME exists..."
if [ "$(db_exists "${DB_CONN_ADMIN[@]}" "$DB_NAME")" == "$DB_NAME" ]; then
  log INFO "Database '$DB_NAME' already exists - skipping creation."
else
  log INFO "Database '$DB_NAME' does not exist."
  create_database
  apply_schema
fi

# App user creation
declare -A USER_PRIVILEGES=( ["%"]="SELECT, INSERT, UPDATE, DELETE" ["localhost"]="ALTER, SELECT, INSERT, UPDATE, DELETE" )

for host in "%" "localhost"; do
log INFO "Checking if User '$DB_APP_USER'@'$host' already exists..."
  if [ "$(user_exists "${DB_CONN_ADMIN[@]}" "$DB_APP_USER" "$host")" -gt 0 ]; then
    log INFO "User '$DB_APP_USER'@'$host' already exists - skipping creation."
  else
    create_app_user "$DB_APP_USER" "$host" "${USER_PRIVILEGES[$host]}"
  fi
done

log INFO "=== Database setup completed successfully ==="
exit 0
