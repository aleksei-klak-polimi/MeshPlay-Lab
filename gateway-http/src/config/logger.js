export class HttpLoggerMetadata {
    constructor ( requestId ){
        this.requestId = requestId;
    }

    toString(){
        return `[Request ID: ${this.requestId}]`;
    }
}