import jwt from 'jsonwebtoken';
import config from '../config/config.js';

/**
 * Generates a signed JWT for a given user.
 *
 * @param {string} userId - The unique identifier of the user.
 * @param {string} username - The username of the user.
 * @param {string|number} [expiresIn=config.jwtExpiration] - Optional expiration time for the token (e.g., '1h', '3600').
 * @returns {string} A signed JWT token containing the user ID and username.
 *
 * @example
 * const token = sign('12345', 'alice', '2h');
 */
export default function sign(userId, username, expiresIn = config.jwtExpiration){
    
    return jwt.sign(
        {id: userId, username: username},
        config.jwtSecret,
        {expiresIn}
    )
}