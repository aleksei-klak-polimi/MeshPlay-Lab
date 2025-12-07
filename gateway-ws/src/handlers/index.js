import chatHandler from "./chat.handler.js";
import gameHandler from "./game.handler.js";


/**
 * Maps message `target` values to their respective handler functions.
 *
 * The router uses this object to forward validated client messages
 * based on their `target` field. Each handler is responsible for
 * forwarding the message to an internal microservice via Redis pub/sub.
 *
 * Structure:
 * ```
 * {
 *   "chat": chatHandler,
 *   "game": gameHandler
 * }
 * ```
 *
 * - `chat` -> Publishes user chat messages to `"chat.incoming"`
 * - `game` -> Placeholder for game-related routing; currently publishes to `"game.incoming"`
 *
 * @typedef {(userId: string, message: Object) => void} MessageHandler
 *
 * @type {Record<string, MessageHandler>}
 */
export default {
  "chat": chatHandler,
  "game": gameHandler,
};
