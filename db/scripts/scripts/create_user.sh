#!/bin/bash
# create_user.sh
#
# Creates the application DB user and grants privileges.



set -eE -o pipefail

# Load shared library
LIB_PATH="$(dirname "$0")/lib_common.sh"
if [ -f "$LIB_PATH" ]; then
  source "$LIB_PATH"
else
  echo "[ERROR] Shared library not found: $LIB_PATH"
  exit 1
fi

REQUIRED_VARS=(
  TARGET_ENV
  DB_HOST DB_PORT MYSQL_DATABASE
  DB_ADMIN_USER MYSQL_ROOT_PASSWORD
  MYSQL_USER MYSQL_PASSWORD
  LOG_DIR
)

validate_env_vars REQUIRED_VARS

# Logging
log_init "$LOG_DIR" "$TARGET_ENV" "create_user"
log INFO "Running user creation for environment: $TARGET_ENV"

DB_CONN_ADMIN=("$DB_ADMIN_USER" "$MYSQL_ROOT_PASSWORD" "$DB_HOST" "$DB_PORT")




log INFO "=== Starting user creation ==="

flag_safety "Create User"

db_check_connection "${DB_CONN_ADMIN[@]}"

# Ensure DB exists (a safety validation)
if [ "$(db_exists "${DB_CONN_ADMIN[@]}" "$MYSQL_DATABASE")" != "$MYSQL_DATABASE" ]; then
  log ERROR "Database '$MYSQL_DATABASE' does not exist. Cannot grant privileges."
  exit 1
fi

# Create user
log INFO "Checking if User '$MYSQL_USER'@'%' exists..."
if [ "$(user_exists "${DB_CONN_ADMIN[@]}" "$MYSQL_USER" "%")" -gt 0 ]; then
    log INFO "User '$MYSQL_USER'@'%' already exists - skipping."
else
    log INFO "Creating user '$MYSQL_USER'@'%' with privileges: $USER_PRIVILEGES"

      run_sql "${DB_CONN_ADMIN[@]}" "Create user $MYSQL_USER@%" <<EOF
CREATE USER IF NOT EXISTS '$MYSQL_USER'@'%' IDENTIFIED BY '$MYSQL_PASSWORD';
GRANT $USER_PRIVILEGES ON \`$MYSQL_DATABASE\`.* TO '$MYSQL_USER'@'%';
FLUSH PRIVILEGES;
EOF

fi

log INFO "=== User creation completed successfully ==="
exit 0
