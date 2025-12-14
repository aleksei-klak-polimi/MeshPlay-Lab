# **Docker Environment (MeshPlay-Lab)**

This directory centralizes all Docker-related configuration for the MeshPlay-Lab monorepo.

It provides:

* Environment-specific `docker-compose` definitions
* A single source of truth for Docker networking and exposed ports
* Wrapper scripts that enforce correct lifecycle behavior for **development**, **testing**, and **production**

The goal is to make Docker usage **explicit, predictable, and safe**.

---

## **1. Design Philosophy**

Docker is used differently depending on the environment:

### Development & Testing

* **Only infrastructure services are containerized**:

  * MariaDB
  * Redis
* Application services (HTTP / WS gateways):

  * Run natively on the host machine
  * Connect to Dockerized services via exposed ports

This keeps development fast, flexible, and IDE-friendly while still guaranteeing consistent infrastructure.

### Production

* **Everything is containerized**:

  * MariaDB
  * Redis
  * HTTP gateway
  * WebSocket gateway

In production:

* Databases and Redis are **not exposed externally**
* Only the gateway services expose ports
* Docker networking is used for all internal communication

This minimizes the attack surface and maximizes deployment consistency.

---

## **2. Directory Structure**

```
docker/
 ├── env/                        # Docker environment variables
 │    ├── .env.dev
 │    ├── .env.test
 │    └── .env.prod
 │
 ├── scripts/                    # Docker Compose wrappers
 │    ├── common.sh
 │    ├── dev.sh
 │    ├── test.sh
 │    └── prod.sh
 │
 ├── docker-compose.dev.yml
 ├── docker-compose.test.yml
 ├── docker-compose.prod.yml
 └── README.md
```

---

## **3. Docker Environment Files (`docker/env/`)**

These `.env` files **do not contain secrets**.
They exist to centralize:

* Port mappings
* Log directory locations

### Development / Test (`.env.dev`, `.env.test`)

```
EXTERNAL_DB_PORT=3308
EXTERNAL_REDIS_PORT=6381
```

These values control how MariaDB and Redis are exposed **from Docker to the host**.

### Production (`.env.prod`)

```
EXTERNAL_HTTP_PORT=5000
EXTERNAL_WS_PORT=5050

GATEWAY_HTTP_LOG_DIR=/path/to/MeshPlay-Lab/logs/docker/prod/gateway-http
GATEWAY_WS_LOG_DIR=/path/to/MeshPlay-Lab/logs/docker/prod/gateway-ws
```

These values:

* Define the public entrypoints of the platform
* Control where container logs are persisted on the host

> **Note:** Application secrets and database credentials live under `db/env/` and gateway `env/` directories, not here.

---

## **4. Docker Scripts (`docker/scripts/`)**

The scripts in this directory are **the preferred way** to interact with Docker Compose.

They:

* Enforce environment-specific behavior
* Prevent accidental misuse (e.g. persistent test volumes)
* Centralize project names and compose files

### Make scripts executable

```
chmod +x docker/scripts/*.sh
```

### Common behavior

All scripts wrap `docker compose` via `common.sh`, ensuring consistent flags:

* Project name (`-p`)
* Compose file (`-f`)
* Environment file (`--env-file`)

---

## **5. Development Environment**

```
cd docker/scripts
./dev.sh up
```

Starts:

* MariaDB (with persistent volume)
* Redis (non-persistent, tmpfs)

Other commands:

```
./dev.sh down    # Stop containers
./dev.sh reset   # Stop containers and delete volumes
./dev.sh logs    # Follow logs
```

Use this mode when:

* Developing gateways on the host machine
* Running local services with hot reload

Ensure gateway `.env.dev` files match the ports defined in `docker/env/.env.dev`.

---

## **6. Test Environment**

```
cd docker/scripts
./test.sh up
```

Starts:

* MariaDB (ephemeral)
* Redis (ephemeral)

Shutdown:

```
./test.sh down
```

This automatically removes volumes, ensuring a clean database state for each test run.

Use this mode when:

* Running integration tests from the host
* Validating DB and Redis interactions

Ensure gateway `.env.test` files match the ports defined in `docker/env/.env.test`.

---

## **7. Production Environment**

```
cd docker/scripts
./prod.sh up
```

Starts:

* MariaDB (internal-only)
* Redis (internal-only)
* HTTP Gateway (exposed)
* WebSocket Gateway (exposed)

Other commands:

```
./prod.sh down
./prod.sh logs
```

Production characteristics:

* No external DB / Redis ports
* All services communicate over Docker networking
* Gateways receive DB and Redis configuration via Docker Compose overrides

The exposed ports are defined in `docker/env/.env.prod`.

---

## **8. Database Integration**

MariaDB containers are built using the database Dockerfile:

```
db/Dockerfile
```

The build injects environment-specific entrypoints using:

```
ARG APP_ENV=<dev|test|prod>
```

This allows:

* Shared schema initialization (`init.sql`)
* Environment-specific behavior (e.g. privilege restriction in production)

Database credentials are sourced from:

```
db/env/.env.<env>
```

---

## **9. Recommended Workflow**

* **Development**:

  * `./dev.sh up`
  * Run gateways on the host

* **Testing**:

  * `./test.sh up`
  * Run test suites from the host
  * `./test.sh down` after completion

* **Production simulation**:

  * `./prod.sh up`
  * Access gateways via exposed ports

This setup keeps responsibilities clearly separated while allowing the project to evolve toward fuller containerization over time.
