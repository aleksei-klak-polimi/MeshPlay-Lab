export class SocketLoggerMetadata {
    constructor ( socketId, requestId = null ){
        this.socketId = socketId;
        this.requestId = requestId;
    }

    toString(){

        let string = `[Socket ID: ${this.socketId}]`;

        if(this.requestId)
            string += ` [Request ID: ${this.requestId}]`;

        return string;
    }
}