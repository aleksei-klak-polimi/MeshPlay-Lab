#!/bin/bash
# seed_db.sh
#
# Usage:
#   ./seed_db.sh --env dev
#   ./seed_db.sh --env test
#
# Description:
#   Populates the development database with sample data
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
SEED_DIR="$SCRIPT_DIR/../seeds"

# Validate .env
REQUIRED_VARS=( 
  DB_HOST DB_PORT DB_DEV_NAME DB_TEST_NAME
  DB_DEV_USER DB_DEV_PASSWORD
  DB_TEST_USER DB_TEST_PASSWORD
  SEED_FILE SEED_FILE_TEST
  LOG_DIR 
)

# Load and validate environment
load_env "$ENV_FILE"
validate_env_vars REQUIRED_VARS

# Parse arguments
parse_env_flag $1 $2

# Select environment-specific values
if [[ "$TARGET_ENV" == "test" ]]; then
  DB_TO_SEED="$DB_TEST_NAME"
  DB_USER="$DB_TEST_USER"
  DB_PASSWORD="$DB_TEST_PASSWORD"
  SEED_FILE="$SEED_FILE_TEST"
elif [[ "$TARGET_ENV" == "dev" ]]; then
  DB_TO_SEED="$DB_DEV_NAME"
  DB_USER="$DB_DEV_USER"
  DB_PASSWORD="$DB_DEV_PASSWORD"
  SEED_FILE="$SEED_FILE_TEST"
elif [[ "$TARGET_ENV" == "prod" ]]; then
  echo "[ERROR] Seeding in production is not allowed."
  echo "[INFO] Aborting operation..."
  exit 1
fi

# Init logging
log_init "$SCRIPT_DIR/$LOG_DIR/" "$TARGET_ENV" "seed"
log INFO "Running script for environment: $TARGET_ENV"

# Define reusable DB connection contexts
DB_CONN_APP=("$DB_USER" "$DB_PASSWORD" "$DB_HOST" "$DB_PORT")


# Database Utilities
apply_seed() {
  local seed_path="$SEED_DIR/$SEED_FILE"
  if [ -f "$seed_path" ]; then
    log INFO "Applying seed from $SEED_FILE"
    if mariadb -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" "$DB_TO_SEED" < "$seed_path" 2>>"$LOG_FILE"; then
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

db_check_connection "${DB_CONN_APP[@]}"

log INFO "Checking if Database $DB_NAME exists..."
if [ "$(db_exists "${DB_CONN_APP[@]}" "$DB_TO_SEED")" != "$DB_TO_SEED" ]; then
  log ERROR "Database '$DB_TO_SEED' does not exist - exiting seeding script."
  exit 1
fi

apply_seed

log INFO "=== Database seeding completed successfully ==="
exit 0
