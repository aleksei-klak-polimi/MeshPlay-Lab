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
  DB_HOST DB_PORT DB_NAME
  DB_ADMIN_USER DB_ADMIN_PASSWORD
  SEED_FILE
  LOG_DIR 
)

validate_env_vars REQUIRED_VARS

# Init logging
log_init "$SCRIPT_DIR/$LOG_DIR/" "$TARGET_ENV" "seed"
log INFO "Running script for environment: $TARGET_ENV"

# Define reusable DB connection contexts
DB_CONN_APP=("$DB_ADMIN_USER" "$DB_ADMIN_PASSWORD" "$DB_HOST" "$DB_PORT")


# Database Utilities
apply_seed() {
  local seed_path="$SEED_DIR/$SEED_FILE"
  if [ -f "$seed_path" ]; then
    log INFO "Applying seed from $SEED_FILE"
    if mariadb -u "$DB_ADMIN_USER" -p"$DB_ADMIN_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" < "$seed_path" 2>>"$LOG_FILE"; then
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

flag_safety "Seed Schema"

db_check_connection "${DB_CONN_APP[@]}"

log INFO "Checking if Database $DB_NAME exists..."
if [ "$(db_exists "${DB_CONN_APP[@]}" "$DB_NAME")" != "$DB_NAME" ]; then
  log ERROR "Database '$DB_NAME' does not exist - exiting seeding script."
  exit 1
fi

apply_seed

log INFO "=== Database seeding completed successfully ==="
exit 0
