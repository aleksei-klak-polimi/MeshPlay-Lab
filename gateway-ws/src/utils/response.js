import { UpdateResponse, EventResponse } from "../protocol/frames/response.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import codes from "../protocol/status/codes.js";

const logger = createLogger('utils.response');

/**
 * 
 * @param {import('ws').WebSocket} socket 
 * @param {*} source 
 * @param {*} error 
 * @param {*} metadata 
 * @param {*} userMetadata 
 */
export function errorResponse(socket, source, error, loggerMetadata, resMetadata = null){
    logger.setMetadata(loggerMetadata);

    const status = {
        code: error.code,
        severity: "error",
        message: error.message
    };

    const response = new UpdateResponse(source, status, resMetadata);

    let serialized;
    try{
        serialized = response.serialize();
    } catch (err){
        logger.error('Error while serializing response object, message not sent to client.', 'errorResponse', err);
        return;
    }

    socket.send(serialized);
}

export function successResponse(socket, source, code, message, loggerMetadata, resMetadata = null){
    logger.setMetadata(loggerMetadata);

    const status = {
        code,
        severity: "ok",
        message
    };

    const response = new UpdateResponse(source, status, resMetadata);

    let serialized;
    try{
        serialized = response.serialize();
    } catch (err){
        logger.error('Error while serializing response object, message not sent to client.', 'successResponse', err);
        return;
    }

    socket.send(serialized);
}

export function ackResponse(socket, loggerMetadata, resMetadata = null){
    logger.setMetadata(loggerMetadata);

    const status = {
        code: codes.RECEIVED,
        severity: 'ok',
        message: 'Message forwarded.'
    }

    const response = new UpdateResponse('server', status, resMetadata);

    let serialized;
    try{
        serialized = response.serialize();
    } catch (err){
        logger.error('Error while serializing response object, message not sent to client.', 'ackResponse', err);
        return;
    }

    socket.send(serialized);
}

export function eventResponse(socket, source, payload){
    logger.resetMetadata();

    const response = new EventResponse(source, payload);

    let serialized;
    try{
        serialized = response.serialize();
    } catch (err){
        logger.error('Error while serializing response object, message not sent to client.', 'eventResponse', err);
        return;
    }

    socket.send(serialized);
}

export function updateResponse(socket, source, status, loggerMetadata, resMetadata){
    logger.setMetadata(loggerMetadata);

    const response = new UpdateResponse(source, status, resMetadata);

    let serialized;
    try{
        serialized = response.serialize();
    } catch (err){
        logger.error('Error while serializing response object, message not sent to client.', 'updateResponse', err);
        return;
    }

    socket.send(serialized);
}