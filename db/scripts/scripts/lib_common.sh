#!/bin/bash
# lib_common.sh
# Common functions for database setup, seeding, and other maintenance scripts

# Stop on any error, and propagate pipeline errors
set -eE -o pipefail

# Logging utilities
log_init() {
  local log_dir="$1"
  local target_env="$2"
  local log_name="$3"
  local timestamp
  timestamp="$(date +'%Y%m%d_%H%M%S')"
  LOG_FILE="$log_dir/scripts/$target_env/$log_name/${log_name}_${timestamp}.log"

  mkdir -p "$(dirname "$LOG_FILE")"
}

log() {
  local level="$1"
  shift
  echo "[$(date +'%F %T')] [$level] $*" | tee -a "$LOG_FILE"
}



# Environment handling
validate_env_vars() {
  local -n required_vars_ref=$1
  local missing_vars=()

  for var in "${required_vars_ref[@]}"; do
    if [ -z "${!var:-}" ]; then
      missing_vars+=("$var")
    fi
  done

  if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "[ERROR] Missing required environment variables: ${missing_vars[*]}"
    exit 1
  fi
}

flag_safety() {
  local operation=$1

  if [[ "$TARGET_ENV" == "prod" ]]; then
    log WARNING "You are about to perform the following operation on the production database: '$operation'."
    read -p "Type CONFIRM to continue: " CONFIRM
    if [ "$CONFIRM" != "CONFIRM" ]; then
      log INFO "Aborting operation."
      exit 1
    fi
  fi
}



# Database utilities
db_check_connection() {
  if ! mariadb -u"$1" -p"$2" -h"$3" -P"$4" -e "SELECT 1;" >/dev/null 2>&1; then
    log ERROR "Cannot connect to MySQL server at $3:$4"
    exit 1
  fi
  log INFO "MySQL connection verified."
}

db_exists() {
  local user="$1" pass="$2" host="$3" port="$4" db="$5"
  mariadb -u"$user" -p"$pass" -h"$host" -P"$port" -Nse "SHOW DATABASES LIKE '$db';" 2>>"$LOG_FILE" || true
}

user_exists() {
  local admin="$1" pass="$2" db_host="$3" port="$4" user="$5" host="$6"
  mariadb -u"$admin" -p"$pass" -h"$db_host" -P "$port" \
    -Nse "SELECT COUNT(*) FROM mysql.user WHERE user='$user' AND host='$host';" 2>>"$LOG_FILE" || true
}



# Executes an SQL statement passed via standard input (heredoc).
#
# Usage:
#   run_sql <user> <password> <host> <port> <description> <<EOF
#   <SQL statements>
#   EOF
run_sql() {
  local user="$1" pass="$2" host="$3" port="$4" desc="$5"
  if mariadb -u"$user" -p"$pass" -h"$host" -P"$port" 2>>"$LOG_FILE"; then
    log INFO "$desc - OK"
  else
    log ERROR "$desc - FAILED (see $LOG_FILE for details)"
    exit 1
  fi
}