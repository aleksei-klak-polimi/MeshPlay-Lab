#!/bin/bash
# drop_user.sh
#
# Drops the user specified in the provided .env safely.




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

# --- Configuration ---
REQUIRED_VARS=(
  TARGET_ENV
  DB_HOST DB_PORT MYSQL_DATABASE
  DB_ADMIN_USER MYSQL_ROOT_PASSWORD
  MYSQL_USER
  LOG_DIR
)

validate_env_vars REQUIRED_VARS

# Init logging
log_init "$LOG_DIR" "$TARGET_ENV" "drop"
log INFO "Running script for environment: $TARGET_ENV"

DB_CONN_ADMIN=("$DB_ADMIN_USER" "$MYSQL_ROOT_PASSWORD" "$DB_HOST" "$DB_PORT")




# --- Main execution ---
log INFO "=== Starting user drop for environment: $TARGET_ENV ==="

db_check_connection "${DB_CONN_ADMIN[@]}"

# User drop
log INFO "Checking if User '$MYSQL_USER'@'%' exists..."
if [ "$(user_exists "${DB_CONN_ADMIN[@]}" "$MYSQL_USER" "%")" -gt 0 ]; then
    log INFO "User '$MYSQL_USER'@'%' found."
    log INFO "Dropping user '$MYSQL_USER'@'%'"
    run_sql "${DB_CONN_ADMIN[@]}" "Drop user '$MYSQL_USER'@'%'" <<EOF
DROP USER IF EXISTS '$MYSQL_USER'@'%';
FLUSH PRIVILEGES;
EOF
else
    log INFO "User '$MYSQL_USER'@'%' does not exist - skipping deletion."
fi

log INFO "=== User drop completed successfully ==="
exit 0
