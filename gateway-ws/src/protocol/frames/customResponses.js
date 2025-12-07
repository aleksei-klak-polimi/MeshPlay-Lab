import { UpdateResponse } from "./response.js";
import codes from "../status/codes.js";

/**
 * Creates a standardized error response to send to the client.
 *
 * @param {import('../../constants/errors.js').AppError} error - The error object containing the code and message.
 * @param {{serverSideReqId: string|null, clientSideReqId: string|null}} [metadata=null] - Optional metadata for the message.
 * 
 * @returns {import('./response.js').UpdateResponse} An `UpdateResponse` instance representing the error.
 */
export function errorResponse(error, metadata = null) {
    const status = {
        code: error.code,
        severity: "error",
        message: error.message
    }

    return new UpdateResponse('server', status, metadata);
}

/**
 * Creates a response indicating that the server is ready to receive messages.
 *
 * @returns {import('./response.js').UpdateResponse} An `UpdateResponse` instance indicating server readiness.
 */
export function serverReadyResponse() {
    const status = {
            code: codes.SERVER_READY,
            severity: "ok",
            message: 'Server is ready to receive messages.'
        }

    return new UpdateResponse('server', status);
}

/**
 * Creates an acknowledgment response indicating that a message was received and forwarded.
 *
 * @param {{serverSideReqId: string|null, clientSideReqId: string|null}} metadata - Metadata for messages.
 * @returns {import('./response.js').UpdateResponse} An `UpdateResponse` instance acknowledging the received message.
 */
export function ackResponse(metadata) {
    const status = {
            code: codes.RECEIVED,
            severity: "ok",
            message: 'Message forwarded.'
        }

    return new UpdateResponse('server', status, metadata);
}