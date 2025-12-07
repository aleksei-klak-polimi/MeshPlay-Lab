/**
 * @namespace codes
 * @property {number} RECEIVED
 * @property {number} SERVER_READY
 * @property {number} GENERIC_ERROR
 * @property {number} INTERNAL_ERROR
 * @property {number} INVALID_INPUT
 * @property {number} INVALID_TARGET
 */
const codes = {

    // Ack codes
    RECEIVED:       10000,

    // Server Ready
    SERVER_READY:   30000,

    // Error codes
    GENERIC_ERROR:  40000,
    INTERNAL_ERROR: 50000,
    INVALID_INPUT:  40001,
    INVALID_TARGET: 40401,

}

export default codes;