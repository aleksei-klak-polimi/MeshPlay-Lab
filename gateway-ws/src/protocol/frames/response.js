export class BaseResponse {
    constructor({ type, source, status, payload, metadata }) {
        this.type = type;       // 'event' | 'update
        this.source = source;   // 'chat' | 'lobby' | etc
        this.status = status;
        this.payload = payload; // object
        this.metadata = metadata;
    }

    serialize() {
        return JSON.stringify({
            type: this.type,
            source: this.source,
            status: this.status,
            payload: this.payload,
            metadata: this.metadata,
        });
    }
}

/**
 * Event responses are sent to the client when an event that changed the state of things happens.
 * It contains the new updated value for the state in the payload.
 * 
 * An example might be sending this messages when a user sends a message in a chat lobby to send to the client
 * the contents of the message
 * 
 * A payload is expected to represent the state after the event.
 */
export class EventResponse extends BaseResponse {
  constructor(source, payload) {
    super({
      type: "event",
      source,
      payload
    });
  }
}

/**
 * Update responses are sent to the client to update them on the stage reached by their request
 * Or if a request was rejected it can be used to provide a reason for the rejection.
 */
export class UpdateResponse extends BaseResponse {
    constructor(source, status, metadata) {
        super({
            type: "update",
            source,
            status,
            metadata
        });
    }
}
