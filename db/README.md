## **MeshPlay-Lab Database Setup**
This directory contains the SQL schema, seed data, and shell scripts required to initialize and manage the MeshPlay-Lab database.  
The database is designed for use with MariaDB and currently supports local deployments with plans to support containerized deployments in the near future.
___
### **1. Prerequisites**
- A running MariaDB instance
- A valid `.env` file configured in this directory
- `bash` and `mysql` client installed
- The admin user specified in `.env` must already exist in the DB server

___
### **2. Setup Steps**
**1.** Make the scripts executable:

    chmod +x ./scripts/create_db.sh
    chmod +x ./scripts/seed_db.sh`

**2.** Create the database and users:

    ./scripts/create_db.sh

- Checks connection to the DB using admin credentials.
- Creates the database defined in `DB_NAME` (only if it doesn’t already exist).
- Applies the schema from `init.sql`.
- Verifies that the application users exist:
    - `'<app_user>'`**@**`'localhost'` — granted CRUD + ALTER permissions (for migration and seeding).
    - `'<app_user>'`**@**`'%'` — granted CRUD permissions only (for external services).

**3.** (Optional) Populate with sample data:

    ./scripts/seed_db.sh

___
### **3. Environment Variables**
The scripts rely on the `.env` file for configuration:

    # Environment flag (DEV / PROD)
    ENVIRONMENT=DEV

    # Path to logs folder
    LOG_DIR="../../logs/db"

    # Host and port for MariaDB (localhost for local dev)
    DB_HOST=127.0.0.1
    DB_PORT=3306

    # Admin credentials for DB creation (used by create_db.sh)
    DB_ADMIN_USER=meshplay_admin
    DB_ADMIN_PASSWORD=adminpassword

    # Application credentials (used by Node/Java runtime and by seed_db.sh)
    DB_APP_USER=meshplay_app
    DB_APP_PASSWORD=apppassword

    # Name of the database to create/manage
    DB_NAME=MeshPlay-LabDB

    # Name of the .sql file to use to populate the dev DB with sample data
    SEED_FILE='seed_dev.sql'

The `.env` file must be in the same folder as `.env.example`.

Logs are written under:

    ${LOG_DIR}/scripts/create/
    ${LOG_DIR}/scripts/seed/

___
### **4. Environment Safeguard**
The seed script checks the ENVIRONMENT variable:  
If `ENVIRONMENT=PROD`, the seed script will:
- Display a strong warning
- Require a manual confirmation (e.g., type CONFIRM) before proceeding

This prevents accidental data loss in production.

___
### **5. Folder Structure**
    /db
     ├── init.sql               # Database schema
     ├── README.md              # This file
     ├── seeds/
     │    └── seed_dev.sql      # Development seed data
     ├── scripts/
     │    ├── create_db.sh      # Creates DB, users, applies schema
     │    ├── seed_db.sh        # Populates DB (dev only)
     │    └── lib_common.sh     # Shared functions
     └── .env.example           # Example environment configuration