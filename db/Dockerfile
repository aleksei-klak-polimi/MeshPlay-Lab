FROM mariadb:lts-ubi

# Copy schema as 00.sql (MariaDB auto-runs it)
COPY db/init.sql /docker-entrypoint-initdb.d/

# Copy contents of /docker/$env/ into mariadb entrypoint to allow custom scripts per environment
ARG APP_ENV=dev
COPY db/docker/${APP_ENV} /docker-entrypoint-initdb.d/
