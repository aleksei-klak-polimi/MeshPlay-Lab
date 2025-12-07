# **Gateway WebSocket (gateway-ws)**

## **Overview**
This service acts as the WebSocket gateway for the MeshPlay-Lab platform.
It manages all real-time client connections and is responsible for:
- Authenticating WebSocket upgrade requests using JWT
- Maintaining persistent connections (multiple per user allowed)
- Forwarding user-originated messages to backend microservices via Redis
- Delivering microservice-originated events/updates back to users
- Enforcing schema validation for all incoming client messages
- Managing connection lifecycle (ping/pong, cleanup, logging, etc.)
- Providing documented protocol definitions using AsyncAPI

The WebSocket gateway acts as the messaging hub of the platform, while remaining stateless aside from maintaining connection maps.

Websockets are implemented using the `ws` library.

## **Current User Features**
At the moment, the gateway provides the following:
### **Authentication**
- JWT is required in the Authorization header during the HTTP → WS upgrade.
- Connections without a valid token are rejected.
- After successful authentication, the gateway sends a Server Ready update message.

**Example (via websocat):**

        websocat ws://localhost:5001 --header "Authorization: Bearer <JWT>"

Tokens should be obtained by logging in through the HTTP gateway (`gateway-http`).
### **Message Handling**
**Incoming user messages**  
Clients send the following object shape:

    {
        "target": "chat",
        "payload": { },
        "metadata": {
            "userReqId": "xyz789"
        }
    }

- `target` determines which microservice receives the message (`chat`, `game`, etc.).
- `payload` is opaque — forwarded as-is to the microservice.
- `userReqId` lets the client correlate future updates.

Messages are published to Redis channels:

    <ENV_PREFIX>.<target>.incoming

### **Server Acknowledgement**
If the message is valid and forwarded, the server immediately sends:
- **Message Received** update

If invalid (schema error, malformed JSON), the server sends:
- **Error** update 

Both are well-structured and documented in the AsyncAPI.

### **Microservice → Gateway → Client**
Microservices communicate to the gateway through:

    <ENV_PREFIX>.ws.outgoing

Messages must follow this schema:

    {
        "userId": "7",
        "message": {
            "source": "chat",
            "type": "event",
            "payload": {
                "message": "Hello from chat."
            }
        }
    }

or for state updates:

    {
      "userId": "7",
      "message": {
        "source": "chat",
        "type": "update",
        "status": {
          "code": 2001,
          "severity": "ok",
          "message": "Message delivered."
        },
        "metadata": {
          "userReqId": "xyz789",
          "serverSideReqId": "abc123"
        }
      }
    }

If the message is malformed or missing required fields (`userId`, `type`, etc.), the gateway rejects it and logs a warning.

### **AsyncAPI Documentation**
The WebSocket protocol is fully defined using **AsyncAPI**.  
The documentation can be compiled into HTML:

    npm run bundle:docs

This generates:

    doc/asyncapi/generated/index.html

When running with `NODE_ENV=development`, documentation is served at:

    http://localhost:<PORT>/asyncapi/

### **Ping/Pong & Connection Health**
- The server initiates ping messages at a configurable interval (default 30s via `PING_INTERVAL`).
- If a client fails to reply with pong, the gateway closes the connection.

## **Internal Redis Channel Strategy**
Redis channels are always prefixed using:

    <ENV_PREFIX>.<domain>.<direction>

Examples:
- Messages **from client → microservice**

`dev.chat.incoming`

- Messages **from microservice → client**

`dev.ws.outgoing`

This allows `test`/`dev`/`prod` environments to remain completely isolated.

## **Message Types**
Clients only receive two types of messages:
1. `event`  
Internal state changes from microservices.  
Example:

        {
          "source": "chat",
          "type": "event",
          "payload": { "message": "Hello" }
        }
2. `update`  
Acknowledgements, request updates, and errors.
Example:

        {
          "source": "server",
          "type": "update",
          "status": {
            "code": 1000,
            "severity": "ok",
            "message": "Message received."
          },
          "metadata": {
            "userReqId": "xyz789"
          }
        }


## **Shared Module Dependency (`@meshplay-lab/shared`)**
This service depends on the internal MeshPlay-Lab shared module: `@meshplay-lab/shared` for the following functionalities:
- Logging Utilities
- MariaDB connection pooling
- Model modules for basic `CRUD` logic
- JWT creation and verification helpers
- Testing utilities such as:
    - `.env.test` loader
    - Test database initialization (schema creation, seeding)


## **Testing Architecture**
The service includes **unit** and **integration** tests, run together with:

    npm test

### **Integration Tests**
Integration tests require:
- **Redis** running
- **MariaDB** running (for auth validation)
- `.env.test` loaded automatically
- AsyncAPI schemas converted to JSON

During test setup, the test initialization script converts AsyncAPI YAML files into JSON Schemas for test validation at the directory:

    tests/integration/schemas/

### **Test Coverage**
Coverage output is generated under:

    gateway-ws/coverage

## **Environment Variables**
The gateway uses two separate environment files:
- `.env` — for dev/prod
- `.env.test` — for test environment

A template for each exists in the project.

### **Environment Variable Structure**
    NODE_ENV='development'
    PORT=5001

    # Logging
    LOG_DIR=../logs/gateway-ws/dev
    LOG_LEVEL=trace

    # Database
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_APP_USER=meshplay_app
    DB_APP_PASSWORD='apppassword'
    DB_NAME=MeshPlay-LabDB
    DB_TIMEZONE=Europe/Rome

    # WebSocket Ping-Pong timer
    PING_INTERVAL=30000

    # JWT
    JWT_SECRET='add JWT secret here'
    JWT_EXPIRATION='1h'

    # Redis
    REDIS_URL='redis://localhost:6379'
    ENV_PREFIX='dev'

Additionally `.env.test` also contains the following variables:

    # ASYNCAPI To JSON Schema
    DOCS_PATH='./doc/asyncapi/components/channels/'
    OUTPUT_DOCS_PATH='./tests/integration/schemas/'

>**Notes**
>- Dev environment credentials must match the dev database.
>- Test environment credentials must match the isolated test database.
>- MariaDB must be running in order to execute integration tests.
>- Redis must be running in order to execute integration tests.

## **Development Workflow**

### **Install dependencies**
    npm install
### **Start the server**
    npm start
### **Run tests**
    npm test
### **Build AsyncAPI docs**
    npm run bundle:docs
### **Run in development mode with autoreload**
    npm run dev
>**Notes**  
>The server internally uses relative path resolution from the current-working-directory or `cwd`, for this reason all of the above commands must be run from the `gateway-ws` folder.

## **Directory Structure**
    gateway-ws/
    ├─ doc/
    │  └─ asyncapi/                       # protocol documentation
    │     └─ generated/                   # HTML docs
    ├─ tests/
    │  ├─ .env.test.example
    │  ├─ mocks/                          # Jest mocks for unit tests
    │  ├─ unit/                           # Unit tests
    │  └─ integration/                    # Integration tests
    │     ├─ schemas/                     # generated JSON schemas for tests
    │     └─ setup/                       # Setup/Teardown scripts
    ├─ src/
    │  ├─ config/
    │  │  ├─ config.js
    │  │  ├─ logger.js
    │  │  └─ redis.js
    │  ├─ constants/
    │  │  └─ errors.js
    │  ├─ handlers/
    │  │  ├─ chat.handler.js
    │  │  ├─ disconnection.handler.js
    │  │  ├─ game.handler.js
    │  │  └─ index.js
    │  ├─ middleware/
    │  │  └─ auth.middleware.js           # JWT validation at upgrade
    │  ├─ protocol/
    │  │  ├─ frames/
    │  │  │  ├─ customResponses.js
    │  │  │  └─ response.js
    │  │  ├─ status/
    │  │  │  └─ codes.js
    │  │  └─ validators/
    │  │     └─ validator.js
    │  ├─ pubsub/
    │  │  ├─ publisher.js
    │  │  └─ subscriber.js
    │  ├─ server/
    │  │  ├─ connectionManager.js
    │  │  ├─ router.js
    │  │  ├─ websocket.js                  # WebSocket server setup
    │  │  └─ utils/
    │  │     ├─ parser.js
    │  │     └─ sender.js
    │  ├─ utils/
    │  │  ├─ errorSanitizer.js
    │  │  └─ serveFile.js
    │  ├─ app.js
    │  └─ server.js
    ├─ .gitignore
    ├─ .env.example
    ├─ jest.config.js
    ├─ package.json
    ├─ package-lock.json
    └─ README.md

