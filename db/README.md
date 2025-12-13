## **MeshPlay-Lab Database**

This directory contains the SQL schema, seed data, shell scripts, and Docker assets required to initialize, manage, and run the MeshPlay-Lab databases.

The database supports **development**, **testing**, and **production** environments and can be used in **two distinct modes**:

* **Dockerized MariaDB** (recommended)
* **Locally hosted MariaDB** (manual installation on the host)

Both modes share the same schema, environment configuration, and management scripts to ensure consistent behavior across local development, CI, and production.

---

### **1. Overview & Concepts**

#### Environments

Each environment (`dev`, `test`, `prod`) is fully isolated and has:

* Its own database schema
* Its own application-level user
* Its own environment file under `db/env/`

#### Users & Privileges

Two categories of credentials are used:

* **Admin / bootstrap user**

  * Used *only* by scripts and Docker entrypoints
  * Responsible for:

    * Creating and dropping schemas
    * Creating and dropping users
    * Granting privileges

* **Application user**

  * Used by Node.js services at runtime
  * Has **restricted privileges** for safety

The meaning of `DB_ADMIN_USER` and `MYSQL_ROOT_PASSWORD` depends on the deployment mode:

* **Docker**:

  * These map to the MariaDB *root* credentials
  * Used by the official MariaDB entrypoint during first container startup

* **Local MariaDB**:

  * They may belong to any user that has:

    * Permission to create/drop schemas
    * Permission to create/drop users it owns
    * Grant privileges on schemas it creates

---

### **2. Folder Structure**

```
/db
 ├── docker/                     # Docker entrypoint extensions (per environment)
 │    ├── dev/
 │    ├── test/
 │    └── prod/
 │         └── restrict-privileges.sh
 │
 ├── docs/                       # Documentation
 ├── env/                        # Environment-specific configuration
 │    ├── .env.dev.example
 │    ├── .env.test.example
 │    ├── .env.prod.example
 │    └── .env.*                 # Real env files (gitignored)
 │
 ├── scripts/
 │    ├── db.sh                  # Main entrypoint for human usage
 │    ├── env/                   # Environment loaders & routers
 │    │    ├── dev.sh
 │    │    ├── test.sh
 │    │    ├── prod.sh
 │    │    ├── router.sh
 │    │    └── lib_common.sh
 │    └── scripts/               # Low-level DB logic (not callable directly)
 │         ├── create_schema.sh
 │         ├── drop_schema.sh
 │         ├── create_user.sh
 │         ├── drop_user.sh
 │         ├── seed.sh
 │         └── lib_common.sh
 │
 ├── seeds/                      # Seed data
 │    └── seed_dev.sql
 │
 ├── Dockerfile                  # MariaDB image with env-aware entrypoints
 ├── init.sql                    # Database schema
 └── README.md                   # This file
```

---

### **3. Environment Configuration (`db/env/`)**

Each environment has its own `.env` file under `db/env/`.

These files are consumed by:

* `docker-compose` (to configure MariaDB containers)
* Database management scripts
* Automated test suites (integration tests)

Example: **`.env.dev.example`**

```
# ====== DEVELOPMENT DATABASE ======
TARGET_ENV="dev"

# Absolute Path to desired logs folder
LOG_DIR="path/to/MeshPlay-Lab/logs/dev/db/scripts"

# Admin credentials (creation / deletion only)
DB_ADMIN_USER=root
MYSQL_ROOT_PASSWORD='rootPass'

# Application credentials (used at runtime)
MYSQL_USER=meshplay_dev
MYSQL_PASSWORD='devPass'
USER_PRIVILEGES='ALTER, SELECT, INSERT, UPDATE, DELETE'

# Database name
MYSQL_DATABASE=MeshPlay-LabDB_Dev

# Seed data
SEED_FILE='seed_dev.sql'
```

> **Important:**
>
> * These files contain sensitive data and must **never** be committed
> * Copy from `.env.<env>.example` and adjust values accordingly

---

### **4. Script Usage (Local or CI)**

The scripts allow managing schemas and users **without Docker**, or from automated systems such as test suites.

#### Make scripts executable

```
chmod +x db/scripts/db.sh
chmod +x db/scripts/env/dev.sh
chmod +x db/scripts/env/test.sh
chmod +x db/scripts/env/prod.sh
```

> `test.sh` **must** be executable, as it is used by automated test suites.

#### Main entrypoint: `db.sh`

```
./db.sh <env> <action> <db_host> <db_port>
```

* `<env>`: `dev | test | prod`
* `<action>`:

  * `createSchema`
  * `dropSchema`
  * `createUser`
  * `dropUser`

Example:

```
./db.sh dev createSchema 127.0.0.1 3306
```

#### Environment-specific entrypoints

You may bypass `db.sh` and call environment loaders directly:

```
./dev.sh <action> <db_host> <db_port>
./test.sh <action> <db_host> <db_port>
./prod.sh <action> <db_host> <db_port>
```

These scripts:

1. Load the correct `.env` file from `db/env/`
2. Route the action to the appropriate low-level script

---

### **5. Seeding Data**

Seeding is supported for **development** and **testing** environments only.

The seed file is defined in the environment configuration via `SEED_FILE` and must exist under `db/seeds/`.

Production seeding is intentionally restricted.

---

### **6. Docker Support**

The database can be built and run as a Docker image using the provided `Dockerfile`.

#### Dockerfile behavior

* Base image: `mariadb:lts-ubi`
* `init.sql` is copied as `00.sql` and automatically executed on first startup
* Environment-specific scripts under `db/docker/<env>/` are injected into the MariaDB entrypoint

```
ARG APP_ENV=dev
COPY db/docker/${APP_ENV} /docker-entrypoint-initdb.d/
```

#### Environment-specific Docker logic

* `dev/` and `test/` currently rely on default MariaDB behavior
* `prod/` includes `restrict-privileges.sh`, which:

  * Revokes excessive privileges from the default application user
  * Re-grants only the privileges specified in `USER_PRIVILEGES`

This ensures a reduced attack surface for public-facing production services.

---

### **7. Local MariaDB Setup (Without Docker)**

If you choose to run MariaDB directly on your host machine instead of using Docker, follow the steps below.

#### Prerequisites

* A running MariaDB instance on your machine or reachable over the network
* An **admin user** configured as described earlier, with permissions to:

  * Create and drop schemas
  * Create and drop users it owns
  * Grant privileges on schemas it creates

#### Setup Steps

**1. Ensure MariaDB is running**
Confirm that your MariaDB server is reachable and that the admin credentials are valid.

**2. Make scripts executable**

```
chmod +x db/scripts/db.sh
chmod +x db/scripts/env/dev.sh
chmod +x db/scripts/env/test.sh
chmod +x db/scripts/env/prod.sh
```

**3. Configure environment files**

Under `db/env/`, configure the `.env` files for the environments you want to support:

* `dev`
* `test`
* `prod`

You may configure **one, two, or all three** environments. There are no restrictions on hosting multiple schemas in the same MariaDB instance.

Ensure each `.env` file contains:

* Correct admin credentials
* Correct application user credentials
* Correct database name
* Appropriate privileges

**4. Create schemas and users**

Run the scripts against your local MariaDB instance.

Example (development):

```
./db.sh dev createSchema 127.0.0.1 3306
./db.sh dev createUser   127.0.0.1 3306
```

Example (production):

```
./db.sh prod createSchema 127.0.0.1 3306
./db.sh prod createUser   127.0.0.1 3306
```

Example (testing):

```
./db.sh test createUser 127.0.0.1 3306
```

> For **testing**, creating the user is sufficient.
> Test suites will automatically drop and recreate the schema as part of their lifecycle.

**5. Configure dependent services**

Provide the following values to the other services in the monorepo (HTTP gateway, WS gateway, test runners):

* Database host
* Database port
* Application user name
* Application user password
* Database name

These values must match the ones defined in the corresponding `.env` file.

**6. Ready to go**

At this point, the database is fully configured and ready for use by the rest of the system, whether for local development, testing, or production.
