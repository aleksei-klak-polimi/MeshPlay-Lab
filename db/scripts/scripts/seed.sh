#!/bin/bash
# seed.sh
#
# Populates the specified database with sample data



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
SEED_DIR="$SCRIPT_DIR/../../seeds"

# Validate .env
REQUIRED_VARS=( 
  TARGET_ENV
  DB_HOST DB_PORT MYSQL_DATABASE
  DB_ADMIN_USER MYSQL_ROOT_PASSWORD
  SEED_FILE
  LOG_DIR 
)

validate_env_vars REQUIRED_VARS

# Init logging
log_init "$LOG_DIR" "$TARGET_ENV" "seed"
log INFO "Running script for environment: $TARGET_ENV"

# Define reusable DB connection contexts
DB_CONN_APP=("$DB_ADMIN_USER" "$MYSQL_ROOT_PASSWORD" "$DB_HOST" "$DB_PORT")


# Database Utilities
apply_seed() {
  local seed_path="$SEED_DIR/$SEED_FILE"
  if [ -f "$seed_path" ]; then
    log INFO "Applying seed from $SEED_FILE"
    if mariadb -u "$DB_ADMIN_USER" -p"$MYSQL_ROOT_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" "$MYSQL_DATABASE" < "$seed_path" 2>>"$LOG_FILE"; then
      log INFO "Applied seed file '$SEED_FILE' successfully"
    else
      log ERROR "Failed applying '$SEED_FILE' (see $LOG_FILE for details)"
      exit 1
    fi
  else
    log ERROR "Seed file '$seed_path' not found!"
    exit 1
  fi
}



# Main Script
log INFO "=== Starting database seeding ==="

if [[ "$TARGET_ENV" == "prod" ]]; then
  echo "[ERROR] Seeding in production is not allowed."
  echo "[INFO] Aborting operation..."
  exit 1
fi

db_check_connection "${DB_CONN_APP[@]}"

log INFO "Checking if Database $MYSQL_DATABASE exists..."
if [ "$(db_exists "${DB_CONN_APP[@]}" "$MYSQL_DATABASE")" != "$MYSQL_DATABASE" ]; then
  log ERROR "Database '$MYSQL_DATABASE' does not exist - exiting seeding script."
  exit 1
fi

apply_seed

log INFO "=== Database seeding completed successfully ==="
exit 0
