export class ResponseMetadata{
    constructor({serverSideReqId = null, clientSideReqId = null}){
        this.serverSideReqId = serverSideReqId;
        this.clientSideReqId = clientSideReqId;
    }
}