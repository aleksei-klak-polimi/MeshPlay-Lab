# **MeshPlay-Lab Gateway — OpenAPI Documentation Overview**
This directory contains the API specification for the MeshPlay-Lab gateway service.
The specification follows OpenAPI 3.1, is modularized into multiple YAML files, and is bundled into a single distributable document before being served through Swagger UI.

## **About the Documentation**
The gateway automatically exposes an interactive Swagger UI at:

    /api/docs

However, **Swagger UI only works after generating the bundled OpenAPI file**.

### **Generate the bundled OpenAPI file:**

    npm run bundle:docs

The bundling step merges all specification fragments under:

    gateway-http/doc/openapi/

into a single `bundled.yaml` file used by both:
- Swagger UI
- Integration tests (for response schema validation)

## **API Conventions**
Below are the conventions consistently applied across all endpoints.

### **1. Request Metadata (meta)**
Every request receives:
- a **requestId** (UUID)
- a **timestamp** at the moment the request enters the system

Example:

    "meta": {
        "requestId": "f3edc8e2-3f1b-4df1-bab6-b05e754e03de",
        "timestamp": "2025-11-16T20:58:22.123Z"
    }

Returned **for all responses**, including errors.

### **2. Standard Response Format**
**Success Response**

    {
        "success": true,
        "message": "User signed up successfully",
        "data": {
            "id": "42",
            "username": "johndoe",
            "createdAt": "2025-11-12T22:41:51.540Z",
            "lastLogin": null
        },
        "meta": {
        "requestId": "6c338a41-381b-4ac3-a63c-937f312df16b",
        "timestamp": "2025-11-16T22:41:51.540Z"
        }
    }

**Error Response**

Errors share a consistent shape:

    {
        "success": false,
        "message": "Invalid username or password",
        "error": {
            "code": "INVALID_CREDENTIALS",
            "details": [
                "The provided username or password are wrong."
            ]
        },
        "meta": {
            "requestId": "e7aa9823-c7a9-4b90-b27c-52b61ccf6a10",
            "timestamp": "2025-11-16T22:41:51.540Z"
        }
    }

**Error conventions:**
- `message` → what the user sees
- `error.code` → machine-readable enum
- `error.details` → optional extra explanation
- `meta` → always included

### **3. Authentication**
The gateway uses JWT Bearer tokens.

Header:

    Authorization: Bearer <token>

All `User/*` routes require JWT authentication.

### **4. Path & Parameter Conventions**
- All user IDs follow the pattern:

        ^[0-9]+$

- `POST /auth/signup` and `POST /auth/login` always validate via JOI before controller execution.
- `PATCH /user/{id}` supports partial updates of username and/or password.


## **Curl Examples**
Below are realistic examples that match the API specification precisely.

### **Signup Example**

    curl -X POST http://localhost:5000/api/auth/signup \
        -H "Content-Type: application/json" \
        -d '{
                "username": "new_user",
                "password": "Passw0rd!"
            }'

### **Login Example**

    curl -X POST http://localhost:5000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{
                "username": "new_user",
                "password": "Passw0rd!"
            }'

Response:

    {
        "success": true,
        "message": "User authenticated successfully",
        "data": {
            "token": "eyJh..."
        },
        "meta": { ... }
    }

### **Get User (Authenticated)**

    curl -X GET http://localhost:5000/api/user/42 \
        -H "Authorization: Bearer <TOKEN>"

### **Edit User**

    curl -X PATCH http://localhost:5000/api/user/42 \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer <TOKEN>" \
        -d '{
                "username": "newName"
            }'

Or update password:

    -d '{ "password": "NewPassw0rd!" }'

### **Delete User**
    curl -X DELETE http://localhost:5000/api/user/42 \
        -H "Authorization: Bearer <TOKEN>"


