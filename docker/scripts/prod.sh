#!/bin/bash
# prod.sh
#
# Usage:
#   ./prod.sh [up|down|logs]
#
# Description:
#   Manages Docker Compose for the production environment. 
#   Allows to start (up), stop (down), or view logs (logs) of the containerized services.



set -eE -o pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

PROJECT_NAME="meshplay-lab"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.prod.yml"
ENV_FILE="$SCRIPT_DIR/../env/.env.prod"

source "$SCRIPT_DIR/common.sh"

case "${1:-up}" in
  up)
    compose up -d --build
    ;;
  down)
    compose down
    ;;
  logs)
    compose logs -f
    ;;
  *)
    echo "Unknown command"
    exit 1
    ;;
esac
