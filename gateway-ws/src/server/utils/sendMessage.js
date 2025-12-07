import { createLogger } from '@meshplaylab/shared/src/config/logger.js';

/**
 * Sends a `BaseResponse` message to a WebSocket client.
 * 
 * This function serializes the message and sends it over the provided WebSocket.
 * It logs any serialization errors or issues with sending the message if the socket is not open.
 *
 * @param {import('ws').WebSocket} socket - The WebSocket client to send the message to.
 * @param {import('../../protocol/frames/response.js').BaseResponse} message - The response object to send.
 *  Can be an instance of `BaseResponse` or any class that extends it.
 * @param {{ toString: () => string }} logMeta - Metadata used for logging context, must implement `toString()` for display.
 * 
 * @returns {void} This function does not return a value.
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