import bcrypt from 'bcrypt';
import { CONSTANTS } from  '../constants/constants.js';

export async function hashPassword( password ) {
    const passwordHash = await bcrypt.hash(password, CONSTANTS.SALT_ROUNDS);
    return passwordHash;
}

export async function validatePassword( password, passwordHash ) {
    const result = await bcrypt.compare(password, passwordHash);
    return result;
}