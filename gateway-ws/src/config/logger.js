export class SocketLoggerMetadata {
    constructor ( socketId = null, requestId = null ){
        this.socketId = socketId;
        this.requestId = requestId;
    }

    toString(){

        let string = '';

        if(this.socketId)
            string = ` [Socket ID: ${this.socketId}]`;

        if(this.requestId)
            string += ` [Request ID: ${this.requestId}]`;

        return string.trim();
    }
}