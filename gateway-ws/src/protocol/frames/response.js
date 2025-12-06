/**
 * @typedef {Object} ResponseStatus
 * @property {typeof import('../status/codes.js').default} code - A numeric status code from the `codes` enum.
 * @property {"ok" | "error"} severity - Indicates whether the status represents success or failure.
 * @property {string|null} message - Human-readable message describing the status.
 */

/**
 * @typedef {Object} ResponseMetadata
 * @property {string|null} serverSideReqId - The server-generated request ID.
 * @property {string|null} clientSideReqId - The client-generated request ID.
 */

/**
 * BaseResponse is the base class for all responses sent to clients.
 * It provides common fields like type, source, status, payload, and metadata.
 */
export class BaseResponse {
    /**
     * @param {Object} options
     * @param {'event'|'update'} options.type - The type of response.
     * @param {string} options.source - The origin of the response (e.g., 'chat', 'lobby').
     * @param {ResponseStatus|null} [options.status] - Optional status object describing the response result.
     * @param {Object|null} [options.payload] - Optional payload containing the response data.
     * @param {ResponseMetadata|null} [options.metadata] - Optional metadata for the response.
     */
    constructor({ type, source, status, payload, metadata }) {
        /**@type {'event'|'update'} */
        this.type = type;

        /**@type {string} */
        this.source = source;

        /**@type {ResponseStatus|null} */
        this.status = status;

        /**@type {Object|null} */
        this.payload = payload;

        /**@type {ResponseMetadata|null} */
        this.metadata = metadata;
    }

    /**
     * Serializes the response object to a JSON string.
     * 
     * @returns {string} JSON representation of the response.
     */
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
 * EventResponse represents a response for an event that changed the state of the system.
 * The payload contains the updated state after the event.
 *
 * Example: sending a new chat message to clients in a lobby.
 */
export class EventResponse extends BaseResponse {
    /**
     * @param {string} source - The origin of the event (e.g., "chat", "lobby").
     * @param {Object} payload - The updated state produced by the event.
     */
  constructor(source, payload) {
    super({
      type: "event",
      source,
      payload
    });
  }
}

/**
 * UpdateResponse represents a response providing the current status or progress of a request.
 * Can also provide a reason if a request was rejected.
 */
export class UpdateResponse extends BaseResponse {
     /**
     * @param {string} source - The origin of the update (e.g., 'chat', 'lobby').
     * @param {ResponseStatus} status - The current status or result of the request.
     * @param {ResponseMetadata} [metadata] - Optional metadata from `responseMetadata`.
     */
    constructor(source, status, metadata) {
        super({
            type: "update",
            source,
            status,
            metadata
        });
    }
}
