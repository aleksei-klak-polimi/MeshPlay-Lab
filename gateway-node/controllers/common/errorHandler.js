import { errorResponse } from "./response.js";

export function handleError(err, res){
    const status = err.isAppError ? err.status : 500;
    const code = err.isAppError ? err.code : 'INTERNAL_ERROR';
    const message = err.isAppError ? err.message : 'An unexpected server error occurred';

    return errorResponse(res, message, code, status);
}