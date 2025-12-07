import bcrypt from 'bcrypt';
import { CONSTANTS } from  '../constants/constants.js';

/**
 * Hash a plaintext password using bcrypt.
 *
 * @param {string} password - Raw password to hash.
 * @returns {Promise<string>} The hashed password.
 */
export async function hashPassword( password ) {
    const passwordHash = await bcrypt.hash(password, CONSTANTS.SALT_ROUNDS);
    return passwordHash;
}

/**
 * Validate a plaintext password against a stored hash.
 *
 * @param {string} password - Raw password to compare.
 * @param {string} passwordHash - Stored bcrypt hash.
 * @returns {Promise<boolean>} Whether the password is valid.
 */
export async function validatePassword( password, passwordHash ) {
    const result = await bcrypt.compare(password, passwordHash);
    return result;
}