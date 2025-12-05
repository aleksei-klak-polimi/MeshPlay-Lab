import { createLogger } from '@meshplaylab/shared/src/config/logger.js';

/**
 * 
 * @param {import('ws').WebSocket} socket 
 * @param {import('../protocol/frames/response.js').BaseResponse} message 
 * @param {{ toString: function(): string }} logMeta 
 */
export default function sendMessage(socket, message, logMeta){
    const logger = createLogger('utils.sendMessage');
    logger.setMetadata(logMeta);

    let serialized;
    try{
        serialized = message.serialize();
    } catch (err){
        logger.error('Error while serializing response object, message not sent to client.', err);
        return;
    }

    try{
        if(socket.readyState === 1)
            socket.send(serialized);
        else
            logger.warn('Could not send message to socket, socket is not OPEN.');
    } catch(err) {
        logger.error('Error while sending message to client. Message not sent.', err);
    }
    
}