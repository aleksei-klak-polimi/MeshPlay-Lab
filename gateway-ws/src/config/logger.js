/**
 * Metadata object used for logging socket-related events.
 * Contains optional identifiers for both the socket and the request.
 */
export class SocketLoggerMetadata {
    /**
     * @param {string|null} [socketId=null] - Unique identifier associated with the WebSocket connection.
     * @param {string|null} [requestId=null] - Unique identifier associated with an incoming client request.
     */
    constructor ( socketId = null, requestId = null ){
        /** @type {string|null} */
        this.socketId = socketId;

        /** @type {string|null} */
        this.requestId = requestId;
    }

    /**
     * Converts the metadata object to a human-readable string for logging.
     * 
     * Format examples:
     * - `" [Socket ID: 123]"`
     * - `" [Socket ID: 123] [Request ID: abc]"`
     * - `" [Request ID: abc]"`
     *
     * @returns {string} A formatted string representing the metadata.
     */
    toString(){
        let string = '';

        if(this.socketId)
            string = ` [Socket ID: ${this.socketId}]`;

        if(this.requestId)
            string += ` [Request ID: ${this.requestId}]`;

        return string.trim();
    }
}