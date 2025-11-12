#!/bin/bash
set -e
SCRIPT_DIR="$(dirname "$0")"
"${SCRIPT_DIR}/../seed_db.sh" --env dev
