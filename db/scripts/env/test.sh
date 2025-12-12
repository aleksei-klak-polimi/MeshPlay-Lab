#!/bin/bash
# test.sh
#
# Usage:
#   ./test.sh [createSchema|dropSchema|createUser|dropUser]
#
# Description:
#   Loads ".env.test" variables before performing the requested action.



# Stop on any error, and propagate pipeline errors
set -eE -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load shared library
LIB_PATH="$SCRIPT_DIR/lib_common.sh"
if [ -f "$LIB_PATH" ]; then
  source "$LIB_PATH"
else
  echo "[ERROR] Shared library not found: $LIB_PATH"
  exit 1
fi

load_env "$SCRIPT_DIR/../../env/.env.test"

exec "$SCRIPT_DIR/router.sh" "$@"