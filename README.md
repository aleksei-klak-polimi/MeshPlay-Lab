# **MeshPlay-Lab — Microservice Gaming Platform**

**Meshplay-Lab** is a personal project focused on exploring modern **microservice-based architecture** through the development of a modular, online gaming platform.  
Each service is developed as an **independent component** — potentially in different programming languages — communicating through well-defined interfaces.

The project allows experimentation with:
- Distributed systems design
- Language-specific performance tradeoffs
- API design and documentation
- Inter-service communication methods
- Containerized deployments (Docker)

## **Current Project Status**
MeshPlay-Lab is in an early but functional stage.  
The following core components are now implemented:

### **Gateway Service (Node.js)**
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

A dedicated README for the gateway exists at:  
`/gateway-node/README.md`

### **Database Layer (MariaDB)**
Located under `/db`.  
Includes:
- SQL schema
- Development & testing seed data
- Environment-aware scripts to create, drop, and seed databases
- Isolated **prod / dev / test** databases
- Safety checks for production environments

Relevant documentation:  
`/db/README.md`

## **Project Structure**
    /
    ├── gateway-node/        # API Gateway (Node.js)
    ├── db/                  # SQL schema + database scripts
    ├── frontend/            # (Upcoming) React + TypeScript UI
    ├── services/            # (Upcoming) Game engines + AI players
    └── README.md            # Root documentation (this file)

## **Installation & Setup Overview**
Because MeshPlay-Lab contains multiple services, installation is handled **inside each service’s directory**.

### **1. Setting up the Database**
Refer to:  
`/db/README.md`

Tasks include:
- Creating dev/test databases
- Seeding data
- Configuring environment variables

### **2. Setting up the Gateway**
See:  
`/gateway-node/README.md`

Includes:
- Installing dependencies
- Setting up environment variables
- Running tests
- Bundling OpenAPI
- Starting the API server

## **Development Roadmap**
The next steps for MeshPlay-Lab focus on expanding the platform:

### **Backend**
- Add WebSocket support to the gateway
- Introduce additional microservices (Java, Go, etc.)
- Implement shared events/messages (Kafka, NATS, or Redis Streams)

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