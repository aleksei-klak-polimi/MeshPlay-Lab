import { InternalError } from "../constants/errors.js"

export function sanitizeError(error, message){
    if(!error.isAppError)
        return new InternalError(message);
    else
        return error;
}