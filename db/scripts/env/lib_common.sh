#!/bin/bash
# lib_common.sh
#
# Common functions for env loading scripts




# Stop on any error, and propagate pipeline errors
set -eE -o pipefail

load_env() {
    local env_file=$1
    if [ -f "$env_file" ]; then
        set -a
        source "$env_file"
        set +a
    else
        echo "[ERROR] Environment file '$env_file' not found!"
        exit 1
    fi
}