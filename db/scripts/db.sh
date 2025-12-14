#!/bin/bash
# db.sh
#
# Usage:
#   ./db.sh [dev|test|prod] [createSchema|dropSchema|createUser|dropUser] [db_host] [db_port]
#
# Description:
#   Main entrypoint to setup/teardown databases for each environment



# Stop on any error, and propagate pipeline errors
set -eE -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ENV=$1
ACTION=$2
DB_HOST=$3
DB_PORT=$4

case $ENV in
    dev)  exec "$SCRIPT_DIR/env/dev.sh"      $ACTION $DB_HOST $DB_PORT ;;
    test) exec "$SCRIPT_DIR/env/test.sh"     $ACTION $DB_HOST $DB_PORT ;;
    prod) exec "$SCRIPT_DIR/env/prod.sh"     $ACTION $DB_HOST $DB_PORT ;;
    *) echo "Invalid environment: $ENV (expected: dev | test | prod)"; exit 1 ;;
esac