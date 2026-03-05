#!/bin/bash
# dev.sh
#
# Usage:
#   ./dev.sh [up|down|reset|logs]
#
# Description:
#   Manages Docker Compose for the development environment. 
#   Allows to start (up), stop (down), reset (reset), or view logs (logs) of the containerized services.



set -eE -o pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

PROJECT_NAME="meshplay-lab_dev"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.dev.yml"
ENV_FILE="$SCRIPT_DIR/../env/.env.dev"

source "$SCRIPT_DIR/common.sh"

case "${1:-up}" in
  up)
    compose up -d --build
    ;;
  down)
    compose down
    ;;
  reset)
    compose down -v
    ;;
  logs)
    compose logs -f
    ;;
  *)
    echo "Unknown command"
    exit 1
    ;;
esac
