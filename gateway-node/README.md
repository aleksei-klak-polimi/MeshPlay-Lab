# **Gateway Service (gateway-node)**

## **Overview**
This service acts as the API gateway for the MeshPlay-Lab platform.
It exposes authentication functionality (signup/login) and basic user management (fetch, edit, delete) while enforcing validation, logging, authentication, and consistent API responses.

It is built on Node.js + Express, with integrated OpenAPI documentation and both unit and integration testing.

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

These features are fully documented in the OpenAPI specification.

## **Codebase Features**
This section covers the architectural and technical characteristics of the gateway service.
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
Both **unit** and **integration** tests run using a single command:

    npm test

Before running tests, it is necessary to generate the bundled OpenAPI document:

    npm run bundle:docs

This is required because **integration tests validate the API responses against the bundled OpenAPI specification**.

### **Test Coverage**
Coverage output is generated under:

    gateway-node/coverage

Integration tests require:
- MariaDB running
- Test database configured
- A separate test `.env` file

## **Environment Variables**
The gateway uses two separate environment files:
- `.env` — for dev/prod
- `.env.test` — for test environment

A template for each exists in the project.

### **Environment Variable Structure**
    NODE_ENV='development'
    PORT=5000

    # Logging
    LOG_DIR=../logs/gateway-node
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

## **Shared Module Dependency (`@meshplay-lab/shared`)**
This service depends on the internal MeshPlay-Lab shared module: `@meshplay-lab/shared` for the following functionalities:
- Logging Utilities
- MariaDB connection pooling
- Model modules for basic `CRUD` logic
- JWT creation and verification helpers
- Testing utilities such as:
    - `.env.test` loader
    - Test database initialization (schema creation, seeding)

## **Directory Structure**
    gateway-node/
    ├─ doc/
    │  ├─ openapi/
    │  └─ README.md
    ├─ tests/
    │  ├─ .env.test.example
    │  ├─ unit/
    │  │  ├─ middleware/
    │  │  │  ├─ auth.middleware.test.js
    │  │  │  └─ validateJSON.middleware.test.js
    │  │  ├─ models/
    │  │  │  └─ common/
    │  │  │     ├─ normalize.test.js
    │  │  │     └─ time.test.js
    │  │  └─ utils/
    │  │     ├─ errorHandler.test.js
    │  │     └─ response.test.js
    │  └─ integration/
    │     ├─ common/
    │     │  └─ openApiLoader.js
    │     ├─ setup/
    │     │  ├─ globalSetup.js
    │     │  ├─ seedTestData.js
    │     │  ├─ setupDB.js
    │     │  └─ teardownDB.js
    │     ├─ user.integration.test.js
    │     └─ auth.integration.test.js
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
    │  ├─ models/
    │  │  ├─ common/
    │  │  │  ├─ normalize.js
    │  │  │  └─ time.js
    │  │  └─ user.model.js
    │  ├─ routes/
    │  │  ├─ auth.routes.js
    │  │  └─ user.routes.js
    │  ├─ schemas/
    │  │  ├─ auth.schema.js
    │  │  ├─ fields.js
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
    ├─ .env.example
    ├─ jest.config.js
    ├─ package.json
    ├─ package-lock.json
    └─ README.md
