import { createLogger } from "../config/logger.js";
import { normalizeRow, normalizeRows } from "./common/normalize.js";

const logger = createLogger('user.model');
const TABLE = 'User';

function formatUser(user){
    const formattedUser = {};
    formattedUser.id = user.id;
    formattedUser.username = user.username;
    formattedUser.passwordHash = user.password_hash;
    formattedUser.createdAt = user.created_at;
    formattedUser.lastLogin = user.last_login;

    return formattedUser;
}

const UserModel = {
    async create(conn, {username, passwordHash, createdAt}){
        try{
            logger.debug(`Inserting user: ${username}`, 'create');
            const result = normalizeRow(await conn.query(
                `INSERT INTO ${TABLE} (username, password_hash, created_at) VALUES (?, ?, ?)`,
                [username, passwordHash, createdAt]
            ));

            logger.debug(`Inserted user '${username}' with ID: ${result.insertId}`, 'create');
            return result.insertId;

        } catch (err) {
            logger.error(`Failed to insert user '${username}': ${err.message}`, 'create');
            throw err;
        }
    },

    async getById(conn, id){
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

    async getByUsername(conn, username){
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

    async update(conn, id, {username, passwordHash, createdAt, lastLogin}){
        try {
            logger.debug(`Updating user ID: ${id}`, 'update');

            const values = [];
            const fields = [];

            if(username)        {values.push(username);     fields.push('username = ?');}
            if(passwordHash)    {values.push(passwordHash); fields.push('password_hash = ?');}
            if(createdAt)       {values.push(createdAt);    fields.push('created_at = ?');}
            if(lastLogin)       {values.push(lastLogin);    fields.push('last_login = ?');}

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
    }
}

export default UserModel;