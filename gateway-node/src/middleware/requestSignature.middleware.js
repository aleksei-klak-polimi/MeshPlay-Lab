import { randomUUID } from "crypto";

export const signRequest = (req, res, next) => {
    const requestId = randomUUID();
    const timeStamp = new Date();
    req.meta = {id: requestId, timeStamp};
    next();
};