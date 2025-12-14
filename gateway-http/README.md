# **Gateway Service (gateway-http)**
This service acts as the HTTP API gateway for the MeshPlay-Lab platform.

It exposes authentication functionality (signup/login) and basic user management (fetch, edit, delete) while enforcing validation, logging, authentication, and consistent API responses.

It is built on **Node.js** + **Express**, with integrated **OpenAPI** documentation and both unit and integration testing.

The gateway can run:
- **Natively on the host machine** (development and testing)
- **As a Docker container** (production or production-like environments)

---
## **Current User Features**
At the moment, the gateway provides the following:
### **Authentication**
- **Signup** new users
- **Login** existing users to receive a JWT access token
### **User Management**
(Currently restricted so that users may only edit/delete their own account.)
- **Get user by ID**
- **Edit authenticated user**
- **Delete authenticated user**

All endpoints are documented in the OpenAPI specification.

---
## **Codebase Features**

### **Technical Features**
- **Express.js** API server
- **JWT authentication**
- **JOI schema validation** (body, params, query)
- **Centralized error handling**
- **Standardized success and error response format**
- **Winston-based structured logging** with:
    - request correlation IDs
    - timestamp metadata
    - dev-friendly console formatting
    - rotating log files
- **MariaDB connection pooling** via `mariadb` driver
- **OpenAPI 3.1** documentation (modular structure under `/doc/openapi`)
- **Swagger UI** available via the gateway when running the `dev` environment

### **Testing Architecture**
Both **unit** and **integration** tests run with:

    npm test

Before running tests, the bundled OpenAPI document must be generated:

    npm run bundle:docs

Integration tests validate API responses against the bundled OpenAPI specification.

### **Test Coverage**
Coverage output is generated under:

    gateway-http/coverage

Integration tests require:
- MariaDB running
- Test database configured
- `.env.test` present and configured under `gateway-http/env/`

---
## **Docker Support**
The gateway can be built and run as a Docker container using:

    gateway-http/Dockerfile

Key characteristics:
- Uses a multi-step build for better caching
- Installs the shared module (`@meshplay-lab/shared`) first
- Runs the gateway in production mode (`npm start`)
- Receives runtime configuration via environment variables (overridden by Docker Compose in production)

In **development and testing**, this gateway typically runs on the host machine and connects to Dockerized infrastructure (MariaDB, Redis).

In **production**, it is intended to run fully containerized as part of the Docker Compose stack.

---
## **Environment Variables**
Environment files must be located under:

    gateway-http/env/

The gateway expects the following environment files by default:
- `.env.prod` — production 
- `.env.dev` — development
- `.env.test` — test runs

A template for each exists in the directory.

More environment files may be used by explicitly specifying the ENV_FILE variable when starting the server manually.  
For example:

    ENV_FILE=.env.custom nodemon src/server.js

If the file specified in `ENV_FILE` does not exist the server will throw an error on startup and stop.

### **Environment Variable Structure**
    NODE_ENV='development'
    PORT=5000

    # Logging
    # Relative or absolute path to desired log directory
    LOG_DIR=/path/to/MeshPlay-Lab/logs/dev/gateway-http
    LOG_LEVEL=trace

    # Database
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_APP_USER=meshplay_app
    DB_APP_PASSWORD='apppassword'
    DB_NAME=MeshPlay-LabDB
    DB_TIMEZONE=Europe/Rome

    # JWT
    JWT_SECRET='add JWT secret here'
    JWT_EXPIRATION='1h'

>**Notes**
>- Dev environment credentials must match the dev database.
>- Test environment credentials must match the isolated test database.
>- MariaDB must be running in order to execute integration tests.

---
## **Shared Module Dependency (`@meshplay-lab/shared`)**
This service depends on the internal MeshPlay-Lab shared module: `@meshplay-lab/shared` for the following functionalities:
- Logging Utilities
- MariaDB connection pooling
- Model modules for basic `CRUD` logic
- JWT creation and verification helpers
- Testing utilities such as:
    - `.env.test` loader
    - Test database initialization (schema creation, seeding)

---
## **Development Workflow**

### **Install dependencies**
    npm install
### **Start the server**
    npm start
### **Build AsyncAPI docs**
    npm run bundle:docs
### **Run tests**
    npm test
### **Run in development mode with autoreload**
    npm run dev

## **Directory Structure**
    gateway-http/
    ├─ doc/
    │  ├─ openapi/                                      # protocol documentation
    │  └─ README.md
    ├─ tests/
    |  ├─ mocks/                                        # Jest mocks for unit tests
    │  ├─ unit/                                         # Unit tests
    │  └─ integration/                                  # Integration tests
    │     ├─ common/
    |     |  └─ openApiLoader.js                        #Logic to load openApi Schemas for testing validation
    │     └─ setup/
    ├─ env/
    │  ├─ .env.dev.example
    │  ├─ .env.test.example
    │  ├─ .env.prod.example
    │  └─ .env.*                                        # Real env files (gitignored)
    ├─ src/
    │  ├─ config/
    │  │  ├─ config.js
    │  │  ├─ db.js
    │  │  ├─ logger.js
    │  │  └─ swagger.js
    │  ├─ constants/
    │  │  ├─ constants.js
    │  │  └─ errorCodes.js
    │  ├─ controllers/
    │  │  ├─ auth.controller.js
    │  │  └─ user.controller.js
    │  ├─ middleware/
    │  │  ├─ auth.middleware.js
    │  │  ├─ requestSignature.middleware.js
    │  │  ├─ validateJSON.middleware.js
    │  │  └─ validateReqSchema.middleware.js
    │  ├─ routes/
    │  │  ├─ auth.routes.js
    │  │  └─ user.routes.js
    │  ├─ schemas/
    │  │  ├─ auth.schema.js
    │  │  └─ user.schema.js
    │  ├─ services/
    │  │  ├─ auth.service.js
    │  │  └─ user.service.js
    │  ├─ utils/
    │  │  ├─ errorHandler.js
    │  │  ├─ errors.js
    │  │  ├─ hashPassword.js
    │  │  └─ response.js
    │  ├─ app.js
    │  └─ server.js
    ├─ .gitignore
    ├─ Dockerfile
    ├─ jest.config.js
    ├─ package.json
    ├─ package-lock.json
    └─ README.md
