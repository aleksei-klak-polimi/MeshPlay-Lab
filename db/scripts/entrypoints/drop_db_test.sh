#!/bin/bash
set -e
SCRIPT_DIR="$(dirname "$0")"
"${SCRIPT_DIR}/../drop_db.sh" --env test