#!/bin/bash
# test.sh
#
# Usage:
#   ./test.sh [up|down|logs]
#
# Description:
#   Manages Docker Compose for the test environment. 
#   Allows to start (up), stop (down), or view logs (logs) of the containerized services.



set -eE -o pipefail

PROJECT_NAME="meshplay-lab_test"
COMPOSE_FILE="../docker-compose.test.yml"
ENV_FILE="../env/.env.test"

source common.sh

case "${1:-up}" in
  up)
    compose up -d --build
    ;;
  down)
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
