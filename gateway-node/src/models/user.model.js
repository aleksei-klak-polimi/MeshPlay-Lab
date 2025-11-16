import { createLogger } from "../config/logger.js";
import { normalizeRow, normalizeRows } from "./common/normalize.js";
import { toMySQLDateTime, fromMySQLDateTime } from "./common/time.js";

const logger = createLogger('user.model');
const TABLE = 'User';

function formatUser(user){
    const formattedUser = {};
    formattedUser.id = user.id;
    formattedUser.username = user.username;
    formattedUser.passwordHash = user.password_hash;

    if(user.created_at)
        formattedUser.createdAt = fromMySQLDateTime(user.created_at);
    else
        formattedUser.createdAt = user.createdAt;

    if(user.last_login)
        formattedUser.lastLogin = fromMySQLDateTime(user.last_login);
    else
        formattedUser.lastLogin = user.lastLogin;

    return formattedUser;
}

const UserModel = {
    async create(requestId, conn, {username, passwordHash, createdAt}){
        logger.setRequestId(requestId);

        try{
            logger.debug(`Inserting user: ${username}`, 'create');
            const result = normalizeRow(await conn.query(
                `INSERT INTO ${TABLE} (username, password_hash, created_at) VALUES (?, ?, ?)`,
                [username, passwordHash, toMySQLDateTime(createdAt)]
            ));

            logger.debug(`Inserted user '${username}' with ID: ${result.insertId}`, 'create');
            return result.insertId;

        } catch (err) {
            logger.error(`Failed to insert user '${username}': ${err.message}`, 'create');
            throw err;
        }
    },

    async getById(requestId, conn, id){
        logger.setRequestId(requestId);

        try {
            logger.debug(`Fetching user by ID: ${id}`, 'getById');
            const rows = normalizeRows(await conn.query(
                `SELECT * FROM ${TABLE} WHERE id = ?`,
                [id]
            ));

            if (rows.length === 0) {
                logger.debug(`No user found with ID: ${id}`, 'getById');
            } else {
                logger.trace?.(`Query result: ${JSON.stringify(rows[0])}`, 'getById');
            }

            return rows[0] ? formatUser(rows[0]) : null;

        } catch (err) {
            logger.error(`Error fetching user ID ${id}: ${err.message}`, 'getById');
            throw err;
        }
    },

    async getByUsername(requestId, conn, username){
        logger.setRequestId(requestId);

        try {
            logger.debug(`Fetching user by username: ${username}`, 'getByUsername');
            const rows = normalizeRows(await conn.query(
                `SELECT * FROM ${TABLE} WHERE username = ?`,
                [username]
            ));

            if (rows.length === 0) {
                logger.debug(`No user found with username: ${username}`, 'getByUsername');
            } else {
                logger.trace?.(`Query result: ${JSON.stringify(rows[0])}`, 'getByUsername');
            }

            return rows[0] ? formatUser(rows[0]) : null;

        } catch (err) {
           logger.error(`Error fetching username '${username}': ${err.message}`, 'getByUsername');
            throw err; 
        }
    },

    async update(requestId, conn, id, {username, passwordHash, createdAt, lastLogin}){
        logger.setRequestId(requestId);

        try {
            logger.debug(`Updating user ID: ${id}`, 'update');

            const values = [];
            const fields = [];

            if(username)        {values.push(username);                     fields.push('username = ?');}
            if(passwordHash)    {values.push(passwordHash);                 fields.push('password_hash = ?');}
            if(createdAt)       {values.push(toMySQLDateTime(createdAt));   fields.push('created_at = ?');}
            if(lastLogin)       {values.push(toMySQLDateTime(lastLogin));   fields.push('last_login = ?');}

            if (values.length === 0) {
                logger.debug(`No fields provided for update (ID: ${id})`, 'update');
                return null;
            }

            const query = `UPDATE ${TABLE} SET ${fields.join(", ")} WHERE id = ?`;
            logger.trace?.(`Executing query: ${query} with values: ${JSON.stringify([...values, id])}`, 'update');

            const result = normalizeRow(await conn.query(query, [...values, id]));
            logger.debug(`Updated user ID: ${id}, affectedRows: ${result.affectedRows}`, 'update');

            return result.affectedRows;

        } catch (err) {
            logger.error(`Failed to update user ID ${id}: ${err.message}`, 'update');
            throw err;
        }
    },

    async delete(requestId, conn, id){
        logger.setRequestId(requestId);

        try{
            logger.debug(`Deleting user ID: ${id}`, 'delete');

            const result = await conn.query(
                `DELETE FROM ${TABLE} WHERE id = ?`,
                [id]
            );

            const affectedRows = result.affectedRows;

            logger.trace(`Query result: ${result}. Affected rows: ${affectedRows}`);

            if(affectedRows && affectedRows > 1){
                logger.error(`Deleting userid: ${id} deleted ${affectedRows} rows in the DB!`, 'delete');
                throw new InternalError('Could not perform action "delete user".');
            }

            return affectedRows;

        } catch (err) {

            logger.error(`Error deleting user ID ${id}: ${err.message}`, 'delete');
            throw err;
            
        }
    }
}

export default UserModel;