#!/bin/bash
# drop_schema.sh
#
# Drops the schema specified in the provided .env safely.



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

# --- Configuration ---
REQUIRED_VARS=(
  TARGET_ENV
  DB_HOST DB_PORT DB_NAME
  DB_ADMIN_USER DB_ADMIN_PASSWORD
  LOG_DIR
)

validate_env_vars REQUIRED_VARS


# Init logging
log_init "$SCRIPT_DIR/$LOG_DIR/" "$TARGET_ENV" "drop"
log INFO "Running script for environment: $TARGET_ENV"

DB_CONN_ADMIN=("$DB_ADMIN_USER" "$DB_ADMIN_PASSWORD" "$DB_HOST" "$DB_PORT")




# --- Main execution ---
log INFO "=== Starting database drop for environment: $TARGET_ENV ==="

db_check_connection "${DB_CONN_ADMIN[@]}"

# Database drop
log INFO "Checking if Database $DB_NAME exists..."
if [ "$(db_exists "${DB_CONN_ADMIN[@]}" "$DB_NAME")" == "$DB_NAME" ]; then
  log INFO "Database '$DB_NAME' found."
  log INFO "Dropping database '$DB_NAME'"
    run_sql "${DB_CONN_ADMIN[@]}" "Drop database $DB_NAME" <<EOF
DROP SCHEMA IF EXISTS \`$DB_NAME\`;
EOF
  log INFO "Database '$DB_NAME' dropped successfully."
else
  log INFO "Database '$DB_NAME' does not exist - skipping deletion."
fi

log INFO "=== Database drop completed successfully ==="
exit 0
