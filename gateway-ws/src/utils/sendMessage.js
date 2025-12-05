import { createLogger } from '@meshplaylab/shared/src/config/logger.js';

const logger = createLogger('utils.response');

/**
 * 
 * @param {import('ws').WebSocket} socket 
 * @param {import('../protocol/frames/response.js').BaseResponse} message 
 * @param {{ toString: function(): string }} logMeta 
 */
export default function sendMessage(socket, message, logMeta){
    logger.setMetadata(logMeta);

    let serialized;
    try{
        serialized = message.serialize();
    } catch (err){
        logger.error('Error while serializing response object, message not sent to client.', 'updateResponse', err);
        return;
    }

    socket.send(serialized);
}