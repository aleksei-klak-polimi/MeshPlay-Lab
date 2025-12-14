# **MeshPlay-Lab Shared Module (`@meshplay-lab/shared`)**
## **Overview**
This package contains common code shared across multiple MeshPlay-Lab services, including:
- `gateway-http` (HTTP gateway)
- `gateway-ws` (WebSocket gateway)
- Future microservices (auth, chat, game, etc.)

It is not a standalone service.
Instead, it provides reusable utilities, helpers, schemas, and constants to ensure consistency across the platform.

## **Purpose**
This module centralizes logic that would otherwise be duplicated between services:

### **Included Features**
- Basic logger logic
- Schema field definitions
- JWT generation and validation
- Date/time and formatting helpers
- Database connection and basic `CRUD` logic
- Utilites such as a helper to load custom `.env` files
- Scripts to help setup testing environments

### **Excluded Features**
To ensure separation of concerns, the shared module does not contain:
- Business logic
- Service-specific controllers
- Transport-specific implementations (HTTP, WS, Redis)

## **Usage in Services**
To utilize this module in another project, add the following line in the package.json dependencies:

    "dependencies": {
        "@meshplaylab/shared": "file:path/to/shared/node",
    }
Then run:
    
    npm install

Then wherever needed, import its modules like so:

    import { createLogger } from '@meshplaylab/shared/src/config/logger.js';

## **Required Environment Variables**
In order for the imported modules to work correctly, it is necessary for the project that imports this package to declare and load the values for the following environment variables:

    NODE_ENV='development'

    # Logging
    LOG_DIR=../logs/gateway-ws
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

## **Testing**
This package includes unit tests for some of its more complex or sensitive modules.  
Tests for the Javascript library can be executed by running from the `shared/node/` directory the following command:

    npm test

Coverage output is generated under:

    shared/node/coverage

## **Directory Structure**

    shared/
    └─ node/
       ├─ src/
       │  ├─ config/
       │  │  ├─ config.js
       │  │  ├─ db.js
       │  │  └─ logger.js
       │  ├─ models/
       │  │  ├─ common/
       │  │  │  ├─ normalize.js
       │  │  │  └─ time.js
       │  │  └─ user.model.js
       │  ├─ schemas/
       │  │  └─ fields.js
       │  ├─ utils/
       │  │  ├─ generateJWT.js
       │  │  ├─ loadEnv.js
       │  │  └─ validateJWT.js
       │  └─ index.js
       ├─ tests/
       │  ├─ integration/ # Scripts to initialize test env in other packages
       │  │  └─ setup/
       │  │     ├─ seedTestData.js
       │  │     ├─ setupDB.js
       │  │     └─ teardownDB.js
       │  ├─ mocks/ # Jest mocks for unit tests
       │  └─ unit/  # Unit tests for local modules
       ├─ jest.config.json
       ├─ package-lock.json
       ├─ package.json
       └─ README.md

