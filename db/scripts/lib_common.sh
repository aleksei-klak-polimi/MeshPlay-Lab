#!/bin/bash
# lib_common.sh
# Common functions for database setup, seeding, and other maintenance scripts

# Stop on any error, and propagate pipeline errors
set -eE -o pipefail

# Logging utilities
log_init() {
  local log_dir="$1"
  local log_name="$2"
  local timestamp
  timestamp="$(date +'%Y%m%d_%H%M%S')"
  LOG_FILE="$log_dir/scripts/$log_name/${log_name}_${timestamp}.log"

  mkdir -p "$(dirname "$LOG_FILE")"
}

log() {
  local level="$1"
  shift
  echo "[$(date +'%F %T')] [$level] $*" | tee -a "$LOG_FILE"
}



# Environment handling
load_env() {
  local env_file="${1:-../.env}"
  if [ -f "$env_file" ]; then
    source "$env_file"
  else
    echo "[ERROR] Environment file '$env_file' not found!"
    exit 1
  fi
}

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