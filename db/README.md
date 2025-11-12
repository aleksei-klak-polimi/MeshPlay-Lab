## **MeshPlay-Lab Database Setup**
This directory contains the SQL schema, seed data, and shell scripts required to initialize and manage the MeshPlay-Lab databases.  
The setup supports **production**, **development**, and **testing** environments, each with its own schema, credentials, and data sets.  
Currently, it is optimized for **MariaDB** on local deployments with plans to support containerized deployments in the near future.
___
### **1. Prerequisites**
- A running MariaDB instance
- A valid `.env` file configured in this directory (see `.env.example`).
- `bash` and `mysql` client installed
- The admin user specified in `.env` must already exist in the DB server

___
### **2. Setup Steps**
**1. Make the scripts executable:**

    chmod +x ./scripts/create_db.sh
    chmod +x ./scripts/drop_db.sh
    chmod +x ./scripts/seed_db.sh

**2. (Optional) Make entrypoint scripts executable:**

    chmod +x ./scripts/entrypoints/create_db_dev.sh
    chmod +x ./scripts/entrypoints/create_db_test.sh
    chmod +x ./scripts/entrypoints/drop_db_dev.sh
    chmod +x ./scripts/entrypoints/drop_db_test.sh
    chmod +x ./scripts/entrypoints/seed_db_dev.sh
    chmod +x ./scripts/entrypoints/seed_db_test.sh

**3. Create the database(s) and relative users:**

You can create separate databases for **development**, **testing** or **production** by using `--env (prod|dev|test)` or using environment-specific entrypoints.

- **Development:**

        ./scripts/create_db.sh --env dev
    or using the entrypoint:

        ./scripts/entrypoints/create_db_dev.sh

- **Testing:**

        ./scripts/create_db.sh --env test
    or using the entrypoint:

        ./scripts/entrypoints/create_db_test.sh

- **Production (manual use only):**

        ./scripts/create_db.sh --env prod

    When run in production mode, the script will always display a confirmation prompt to prevent accidental data creation or overwriting.

Each creation script:

- Checks connection to the DB using admin credentials.
- Creates the database for the specified environment (if it doesn’t already exist).
- Applies the schema from `init.sql`.
- Creates environment-specific application users (if they don't already exist):
    - `'user'@'localhost'` — granted CRUD + ALTER permissions (for migration and seeding).
    - `'user'@'%'` — granted CRUD permissions only (for external services).

**4. Seed Development or Testing Databases:**

Populate your local or CI test database with sample data:
- **Development:**

        ./scripts/seed_db.sh --env dev
    or using the entrypoint:

        ./scripts/entrypoints/seed_db_dev.sh

- **Testing:**

        ./scripts/seed_db.sh --env test
    or using the entrypoint:

        ./scripts/entrypoints/seed_db_test.sh

These scripts will apply the corresponding SQL seed file defined in `.env`.

>**Note:** The seed script cannot run against production databases.  
>It is strictly limited to development and testing environments.

**5. (Optional) Drop Development or Testing Databases:**

To clean up or reset an environment:
- **Development:**

        ./scripts/drop_db.sh --env dev
    or using the entrypoint:

        ./scripts/entrypoints/drop_db_dev.sh

- **Testing:**

        ./scripts/drop_db.sh --env test
    or using the entrypoint:

        ./scripts/entrypoints/drop_db_test.sh

These scripts permanently delete the specified environment database and user accounts.  
>**Note:** Production databases are never dropped automatically.

___
### **3. Environment Variables**
All scripts rely on a shared `.env` file located in this directory.

Example configuration:

    # Path to logs folder relative to scripts
    LOG_DIR="../../logs/db"

    # Host and port for MariaDB (localhost for local dev)
    DB_HOST=127.0.0.1
    DB_PORT=3306

    # Admin credentials for DB creation/deletion (used by create/drop scripts only)
    DB_ADMIN_USER=meshplay_admin
    DB_ADMIN_PASSWORD='adminpass'


    # ====== PRODUCTION DATABASE ======
    DB_PROD_USER=meshplay_prod
    DB_PROD_PASSWORD='prodpass'
    DB_PROD_NAME=MeshPlay-LabDB


    # ====== DEVELOPMENT DATABASE ======
    DB_DEV_USER=meshplay_dev
    DB_DEV_PASSWORD='devpass'
    DB_DEV_NAME=MeshPlay-LabDB_Dev
    SEED_FILE='seed_dev.sql'


    # ====== TESTING DATABASE ======
    DB_TEST_USER=meshplay_test
    DB_TEST_PASSWORD='testpass'
    DB_TEST_NAME=MeshPlay-LabDB_Test
    SEED_FILE_TEST='seed_dev.sql'

Logs are written under:

    ${LOG_DIR}/scripts/${ENV}/create/
    ${LOG_DIR}/scripts/${ENV}/seed/
    ${LOG_DIR}/scripts/${ENV}/drop/

Where `${ENV}` is either `prod`, `dev` or `test` according to the parameter passed through `--env` to the scripts

___
### **4. Environment Safeguard**
The scripts include multiple safety mechanisms:
- **Production:**
    - `create_db.sh --env prod` always displays a confirmation prompt (`Type CONFIRM to continue`).
    - `seed_db.sh` and `drop_db.sh` automatically abort if `--env prod` is passed.
- **Development & Testing:**
    - Can be freely created, dropped, and reseeded.
    - Ideal for local and CI/CD test environments.

___
### **5. Folder Structure**
    /db
     ├── init.sql                       # Database schema
     ├── README.md                      # This file
     ├── seeds/
     │    ├── seed_dev.sql              # Development seed data
     │    └── seed_prod.sql             # (Optional) Production reference data
     ├── scripts/
     │    ├── create_db.sh              # Creates DB, users, applies schema
     │    ├── drop_db.sh                # Base drop logic (dev and test only)
     │    ├── seed_db.sh                # Populates DB (dev and test only)
     │    ├── lib_common.sh             # Shared functions
     │    └── entrypoints/
     │         ├── create_db_dev.sh     # Entrypoint for creating development DB
     │         ├── create_db_test.sh    # Entrypoint for creating testing DB
     │         ├── drop_db_dev.sh       # Entrypoint for development cleanup
     │         ├── drop_db_test.sh      # Entrypoint for testing cleanup
     │         ├── seed_db_dev.sh       # Entrypoint for development seeding
     │         └── seed_db_test.sh      # Entrypoint for testing seeding
     └── .env.example                   # Example environment configuration