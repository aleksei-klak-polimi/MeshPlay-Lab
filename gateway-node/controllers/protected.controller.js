import { createLogger } from "../config/logger.js";
import { successResponse } from "../utils/response.js";

const logger = createLogger('protected.controller');

export function hello(req, res){
    logger.info('Reached protected controller.');

    return successResponse(res, 'Reached protected controller :)');
}