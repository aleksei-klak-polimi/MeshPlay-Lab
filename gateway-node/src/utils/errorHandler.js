import { InternalError } from "./errors.js";

export function handleError(err){
    if(!err)
        throw new TypeError('handleError expectes a non null and non undefined argument');

    if(!err.isAppError){
        return new InternalError();
    } else {
        return err;
    }
}