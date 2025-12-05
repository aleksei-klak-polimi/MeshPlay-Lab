import { UpdateResponse } from "./response";
import codes from "../status/codes";

export function errorResponse(error, metadata = null) {
    const status = {
        code: error.code,
        severity: "error",
        message: error.message
    }

    return new UpdateResponse('server', status, metadata);
}

export function serverReadyResponse() {
    const status = {
            code: codes.SERVER_READY,
            severity: "ok",
            message: 'Server is ready to receive messages.'
        }

    return new UpdateResponse('server', status);
}

export function ackResponse(metadata) {
    const status = {
            code: codes.RECEIVED,
            severity: "ok",
            message: 'Message forwarded.'
        }

    return new UpdateResponse('server', status, metadata);
}