#!/bin/bash
# router.sh
#
# Triggers the appropriate script depending on the provided action



# Stop on any error, and propagate pipeline errors
set -eE -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ACTION=$1

set -a
DB_HOST=$2
DB_PORT=$3
set +a

case $ACTION in
    createSchema) exec "$SCRIPT_DIR/../scripts/create_schema.sh" ;;
    dropSchema) exec "$SCRIPT_DIR/../scripts/drop_schema.sh" ;;
    createUser) exec "$SCRIPT_DIR/../scripts/create_user.sh" ;;
    dropUser) exec "$SCRIPT_DIR/../scripts/drop_user.sh" ;;
    seed) exec "$SCRIPT_DIR/../scripts/seed.sh" ;;
    *) echo "Unknown command $ACTION (expected: createSchema | createUser | dropSchema | dropUser | seed)"; exit 1 ;;
esac