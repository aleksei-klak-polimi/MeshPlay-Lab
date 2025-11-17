import { randomUUID } from "crypto";

/**
 * Middleware: Assigns each incoming request a unique requestId and timestamp.
 *
 * The request metadata is stored in `req.meta = { id, timeStamp }`, and is used
 * for:
 *  - log correlation
 *  - debugging/tracing
 *  - monitoring
 *
 * @param {import('express').Request} req - Incoming request.
 * @param {import('express').Response} res - Response object.
 * @param {import('express').NextFunction} next - Next middleware function.
 */
export const signRequest = (req, res, next) => {
    const requestId = randomUUID();
    const timeStamp = new Date();
    req.meta = {id: requestId, timeStamp};
    next();
};