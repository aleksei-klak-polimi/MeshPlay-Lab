#!/bin/bash
# drop_db.sh
#
# Usage:
#   ./drop_db.sh --env dev
#   ./drop_db.sh --env test
#
# Description:
#   Drops the specified database (and optionally the app user) safely.
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

ENV_FILE="$SCRIPT_DIR/../.env"

# --- Configuration ---
REQUIRED_VARS=(
  DB_HOST DB_PORT
  DB_ADMIN_USER DB_ADMIN_PASSWORD
  LOG_DIR
  DB_DEV_NAME DB_DEV_USER
  DB_TEST_NAME DB_TEST_USER
)

# Load and validate environment
load_env "$ENV_FILE"
validate_env_vars REQUIRED_VARS

# Parse arguments
parse_env_flag $1 $2

# --- Select DB based on target env ---
if [ "$TARGET_ENV" == "test" ]; then
  DB_TO_DROP="$DB_TEST_NAME"
  USER_TO_DROP="$DB_TEST_USER"
elif [[ "$TARGET_ENV" == "dev" ]]; then
  DB_TO_DROP="$DB_DEV_NAME"
  USER_TO_DROP="$DB_DEV_USER"
elif [[ "$TARGET_ENV" == "prod" ]]; then
  echo "[ERROR] Dropping in production is not allowed."
  echo "[INFO] Aborting operation."
  exit 1
fi

# Init logging
log_init "$SCRIPT_DIR/$LOG_DIR/" "$TARGET_ENV" "drop"
log INFO "Running script for environment: $TARGET_ENV"

DB_CONN_ADMIN=("$DB_ADMIN_USER" "$DB_ADMIN_PASSWORD" "$DB_HOST" "$DB_PORT")

# --- Database operations ---
drop_database() {
  log INFO "Dropping database '$DB_TO_DROP'"
  run_sql "${DB_CONN_ADMIN[@]}" "Drop database $DB_TO_DROP" <<EOF
DROP DATABASE IF EXISTS \`$DB_TO_DROP\`;
EOF
  log INFO "Database '$DB_TO_DROP' dropped successfully."
}

drop_user() {
  local user="$1"
  local host="$2"
  log INFO "Dropping user '$user'@'$host'"
  run_sql "${DB_CONN_ADMIN[@]}" "Drop user '$user'@'$host'" <<EOF
DROP USER IF EXISTS '$user'@'$host';
FLUSH PRIVILEGES;
EOF
}

# --- Main execution ---
log INFO "=== Starting database drop for environment: $TARGET_ENV ==="

db_check_connection "${DB_CONN_ADMIN[@]}"

# Database drop
log INFO "Checking if Database $DB_TO_DROP exists..."
if [ "$(db_exists "${DB_CONN_ADMIN[@]}" "$DB_TO_DROP")" == "$DB_TO_DROP" ]; then
  log INFO "Database '$DB_TO_DROP' found."
  drop_database
else
  log INFO "Database '$DB_TO_DROP' does not exist - skipping deletion."
fi

for host in "%" "localhost"; do
log INFO "Checking if User '$USER_TO_DROP'@'$host' exists..."
  if [ "$(user_exists "${DB_CONN_ADMIN[@]}" "$USER_TO_DROP" "$host")" -gt 0 ]; then
    log INFO "User '$USER_TO_DROP'@'$host' found."
    drop_user "$USER_TO_DROP" "$host"
  else
    log INFO "User '$USER_TO_DROP'@'$host' does not exist - skipping deletion."
  fi
done

log INFO "=== Database drop completed successfully ==="
exit 0
