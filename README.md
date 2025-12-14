# **MeshPlay-Lab — Microservice Gaming Platform**

**Meshplay-Lab** is a personal project focused on exploring modern **microservice-based architecture** through the development of a modular, online gaming platform.  
Each service is developed as an **independent component** — potentially in different programming languages — communicating through well-defined interfaces.

The project allows experimentation with:
- Distributed systems design
- Language-specific performance tradeoffs
- API design and documentation
- Inter-service communication methods
- Containerized deployments (Docker)

## **Quick Start (Docker – Production)**
If you want to **download and run the project with minimal setup**, use the production Docker stack.

First of all configure the .env files found at:

- `db/env/.env.prod`
- `docker/env/.env.prod`
- `gateway-http/env/.env.prod`
- `gateway-ws/env/.env.prod`

Then, from the project root run:

    ./docker/scripts/prod.sh up

This will:
- Build all required Docker images
- Start MariaDB, Redis, and all current gateway services
- Load production environment variables

Once running, you can interact with the platform using the ports defined in:

    docker/env/.env.prod

For example:
- HTTP Gateway: `http://localhost:<HTTP_PORT>`
- WS Gateway: `ws://localhost:<WS_PORT>`

No local Node.js setup is required for this path.

---
## **Current Project Status**
MeshPlay-Lab is in an early but functional stage.  
The following core components are now implemented and can be run either **natively** or **containerized**, depending on the environment.

### **Gateway-HTTP (Node.js - REST API)**
Located under `/gateway-http`.

Provides:
- User signup & login (JWT)
- User retrieval, editing, and deletion (self-service logic)
- Unified request validation (JSON schemas)
- Centralized error handling and API response structure
- Fully documented OpenAPI 3.1 spec
- Complete unit + integration test suite

Swagger UI is available after bundling the OpenAPI document:

    npm run bundle:docs

Access via:

    http://localhost:5000/api/docs

Docker support is provided via `gateway-http/Dockerfile`.

Dedicated documentation:  
`/gateway-http/README.md`

### **Gateway-WS (Node.js - WebSocket Server)**
Located under `/gateway-ws`.
Implements the platform’s **real-time communication layer**.

Provides:
- Authenticated WebSocket upgrades (JWT)
- Multi-socket sessions per user
- Heartbeat (ping/pong)
- Message routing into Redis channels (chat/game/etc.)
- Forwarding microservice events to connected clients
- AsyncAPI 3.0 documentation of the real-time protocol
- JSON Schema validation for incoming/outgoing WS messages
- Integration tests + protocol compliance tests

HTML documentation is available after running the following command:

    npm run bundle:docs

Access via:

    http://localhost:5050/asyncapi/

Docker support is provided via `gateway-ws/Dockerfile`.

Dedicated documentation:  
`/gateway-ws/README.md`

### **Shared Library (`@meshplay-lab/shared`)**
Located under `/shared/node`.

Contains logic shared by both gateway services:
- Logging setup
- Database connection pool
- Reusable CRUD helpers
- JWT validation & generation
- Test environment initializer (load `.env.test`, setup/teardown DB)

This ensures consistent behavior and avoids duplication across services.

### **Database Layer (MariaDB)**
Located under `/db`.

Includes:
- SQL schema
- Development & testing seed data
- Environment-aware scripts to create, drop, and seed databases
- Isolated **prod / dev / test** databases
- Safety checks for production environments

Dedicated documentation:  
`/db/README.md`

---
## **Docker & Environment Model**
MeshPlay-Lab now supports Docker-based execution with three distinct environments:
- **development**
- **test**
- **production**

Docker orchestration and lifecycle management are handled via scripts under:

    /docker/scripts

### **Environment Behavior Summary**
| Environment | Containerized Services | Notes |
| ----------- | ---------------------- | ----- |
|**dev** | Infrastructure only (DB, Redis) | Gateways run on host |
|**test** | Infrastructure only (DB, Redis) | Tests run from host |
|**prod** | Infrastructure **and all current services** | Fully containerized runtime |

The design allows developers to:
- Iterate locally with native Node.js processes
- Run isolated integration tests
- Deploy a fully containerized stack for production-like usage

Detailed behavior, scripts, and environment variables are documented in:
`/docker/README.md`

---
## **Project Structure**
    /
    ├── gateway-http/        # HTTP REST API Gateway (Node.js)
    ├── gateway-ws/          # WebSocket Gateway (real-time) (Node.js)
    ├── shared/              # Shared libraries
    ├── db/                  # SQL schema + database scripts
    ├── docker/              # Docker compose files and lifecycle scripts
    ├── frontend/            # (Upcoming) React + TypeScript UI
    ├── services/            # (Upcoming) Game engines + AI players
    └── README.md            # Root documentation (this file)

---
## **Installation & Setup Overview**
MeshPlay-Lab supports **two main workflows**:

### **Docker-first (recommended for quick start / production)**
- Use the Docker scripts under `/docker`
- See: `/docker/README.md`

### **Service-by-service (development & testing)**
Each component can still be set up independently.

#### **1. Setting up the Database**
Refer to:  
`/db/README.md`

Tasks include:
- Creating dev/test databases
- Seeding data
- Configuring environment variables

#### **2. Setting up the shared module**
See:  
`/shared/node/README.md`

Tasks include:
- Installing dependencies
- Running tests

#### **3. Setting up the HTTP Gateway**
See:  
`/gateway-http/README.md`

Tasks include:
- Installing dependencies
- Setting up environment variables
- Running tests
- Bundling OpenAPI
- Starting the API server

#### **4. Setting up the WS Gateway**
See:  
`/gateway-ws/README.md`

Tasks include:
- Installing dependencies
- Setting up environment variables
- Running tests
- Bundling AsyncAPI
- Starting the WS server

---
## **Development Roadmap**
The next steps for MeshPlay-Lab focus on expanding the platform:

### **Backend**
- Add chat+lobby microservice (Java)
- Add additional microservices (Java, Go, etc.)

### **Frontend**
- Build the initial React + TypeScript UI
- Integrate authentication and basic user flows
- Add dashboards for interacting with games

### **Game Services**
- Implement the first multiplayer game engine
- Add AI opponent service written in Python (or another language)

##

## **Contributing**
At the moment, MeshPlay-Lab is a personal project.  
Formal contribution guidelines and workflows (branches, commit standards, CI rules) will be added later once the architecture stabilizes.

##

## **License**
This project is currently unlicensed / for personal educational use.  
A proper license may be added later.