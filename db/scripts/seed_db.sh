#!/bin/bash
# seed_db.sh
# Usage: ./seed_db.sh
# Description: Populates the development database with sample data

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
REQUIRED_VARS=(
  ENVIRONMENT 
  DB_HOST DB_PORT DB_NAME
  DB_APP_USER DB_APP_PASSWORD
  LOG_DIR SEED_FILE
)

ENV_FILE="../.env"
SEED_DIR="../seeds"

# Load and validate environment
load_env "$ENV_FILE"
validate_env_vars REQUIRED_VARS

# Init logging
log_init "$LOG_DIR" "seed"

# Check if Production env then warn user
if [ "$ENVIRONMENT" = "PROD" ]; then
  echo "[WARNING] You are attempting to run the seed script in a PRODUCTION environment."
  echo "This will erase all data in database '$DB_NAME'."
  read -p "Type CONFIRM to continue: " CONFIRM
  if [ "$CONFIRM" != "CONFIRM" ]; then
    echo "[INFO] Aborting seed operation."
    exit 1
  fi
fi

# Define reusable DB connection contexts
DB_CONN_APP=("$DB_APP_USER" "$DB_APP_PASSWORD" "$DB_HOST" "$DB_PORT")


# Database Utilities

apply_seed() {
  local seed_path="$SEED_DIR/$SEED_FILE"
  if [ -f "$seed_path" ]; then
    if mariadb -u "$DB_APP_USER" -p"$DB_APP_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" < "$seed_path" 2>>"$LOG_FILE"; then
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

if [ "$(db_exists "${DB_CONN_APP[@]}" "$DB_NAME")" != "$DB_NAME" ]; then
  log ERROR "Database '$DB_NAME' does not exist - exiting seeding script."
  exit 1
fi

apply_seed

log INFO "=== Database seeding completed successfully ==="
exit 0
