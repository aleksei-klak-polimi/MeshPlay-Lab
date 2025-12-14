#!/bin/bash
# drop_schema.sh
#
# Drops the schema specified in the provided .env safely.




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
  LOG_DIR
)

validate_env_vars REQUIRED_VARS


# Init logging
log_init "$LOG_DIR" "$TARGET_ENV" "drop"
log INFO "Running script for environment: $TARGET_ENV"

DB_CONN_ADMIN=("$DB_ADMIN_USER" "$MYSQL_ROOT_PASSWORD" "$DB_HOST" "$DB_PORT")




# --- Main execution ---
log INFO "=== Starting database drop for environment: $TARGET_ENV ==="

db_check_connection "${DB_CONN_ADMIN[@]}"

# Database drop
log INFO "Checking if Database $MYSQL_DATABASE exists..."
if [ "$(db_exists "${DB_CONN_ADMIN[@]}" "$MYSQL_DATABASE")" == "$MYSQL_DATABASE" ]; then
  log INFO "Database '$MYSQL_DATABASE' found."
  log INFO "Dropping database '$MYSQL_DATABASE'"
    run_sql "${DB_CONN_ADMIN[@]}" "Drop database $MYSQL_DATABASE" <<EOF
DROP SCHEMA IF EXISTS \`$MYSQL_DATABASE\`;
EOF
  log INFO "Database '$MYSQL_DATABASE' dropped successfully."
else
  log INFO "Database '$MYSQL_DATABASE' does not exist - skipping deletion."
fi

log INFO "=== Database drop completed successfully ==="
exit 0
