#!/bin/bash
set -e

echo "Applying limited permissions to user: $MYSQL_USER"

mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF

-- Remove ALL privileges given automatically during init
REVOKE ALL PRIVILEGES, GRANT OPTION FROM '$MYSQL_USER'@'%';

-- Grant only the allowed privileges on the database
GRANT SELECT, INSERT, UPDATE, DELETE ON \`${MYSQL_DATABASE}\`.* TO '$MYSQL_USER'@'%';

FLUSH PRIVILEGES;
EOF

echo "Permissions restricted for user: $MYSQL_USER"