#!/bin/bash
set -eE -o pipefail

compose() {
    docker compose \
        -p "$PROJECT_NAME" \
        -f "$COMPOSE_FILE" \
        --env-file "$ENV_FILE" \
        "$@"
}