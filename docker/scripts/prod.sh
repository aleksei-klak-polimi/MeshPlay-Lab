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

PROJECT_NAME="meshplay-lab"
COMPOSE_FILE="../docker-compose.prod.yml"
ENV_FILE="../env/.env.prod"

source common.sh

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
