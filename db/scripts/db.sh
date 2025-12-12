#!/bin/bash
# db.sh
#
# Usage:
#   ./db.sh [dev|test|prod] [createSchema|dropSchema|createUser|dropUser]
#
# Description:
#   Main entrypoint to setup/teardown databases for each environment



# Stop on any error, and propagate pipeline errors
set -eE -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ENV=$1
ACTION=$2

case $ENV in
    dev)  exec "$SCRIPT_DIR/env/dev.sh"      $ACTION ;;
    test) exec "$SCRIPT_DIR/env/test.sh"     $ACTION ;;
    prod) exec "$SCRIPT_DIR/env/prod.sh"     $ACTION ;;
    *) echo "Invalid environment: $ENV (expected: dev | test | prod)"; exit 1 ;;
esac