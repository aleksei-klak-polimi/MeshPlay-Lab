#!/bin/bash
# create_schema.sh
#
# Creates the database (if missing) and applies the schema.



SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
set -eE -o pipefail

# Load shared library
LIB_PATH="$(dirname "$0")/lib_common.sh"
if [ -f "$LIB_PATH" ]; then
  source "$LIB_PATH"
else
  echo "[ERROR] Shared library not found: $LIB_PATH"
  exit 1
fi

SCHEMA_FILE="$SCRIPT_DIR/../../init/init.sql"

REQUIRED_VARS=(
  TARGET_ENV
  DB_HOST DB_PORT DB_NAME
  DB_ADMIN_USER DB_ADMIN_PASSWORD
  LOG_DIR
)

# Validate
validate_env_vars REQUIRED_VARS

# Logging
log_init "$LOG_DIR" "$TARGET_ENV" "create_schema"
log INFO "Running schema creation for environment: $TARGET_ENV"

DB_CONN_ADMIN=("$DB_ADMIN_USER" "$DB_ADMIN_PASSWORD" "$DB_HOST" "$DB_PORT")


# Schema helper function
applySchema () {
  if [ -f "$SCHEMA_FILE" ]; then
    log INFO "Applying schema from $SCHEMA_FILE"
    if mariadb -u "$DB_ADMIN_USER" -p"$DB_ADMIN_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" < "$SCHEMA_FILE" 2>>"$LOG_FILE"; then
      log INFO "Schema applied successfully."
    else
      log ERROR "Schema application failed (see logs)."
      exit 1
    fi
  else
    log ERROR "Schema file not found: $SCHEMA_FILE"
    exit 1
  fi
}



log INFO "=== Starting schema creation ==="

flag_safety "Create Schema"

db_check_connection "${DB_CONN_ADMIN[@]}"

# Create DB if needed
log INFO "Checking if Database $DB_NAME exists..."
if [ "$(db_exists "${DB_CONN_ADMIN[@]}" "$DB_NAME")" == "$DB_NAME" ]; then
  log INFO "Database '$DB_NAME' already exists - skipping creation."
else
  log INFO "Database '$DB_NAME' does not exist. Creating..."
  run_sql "${DB_CONN_ADMIN[@]}" "Create database $DB_NAME" <<EOF
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;
EOF
  applySchema
fi


log INFO "=== Schema setup completed successfully ==="
exit 0
