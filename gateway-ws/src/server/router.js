import handlers from "../handlers/index.js";
import validateMessage from "../middleware/validateMessage.js";

export default function routeMessage(userId, rawPayload) {
  let msg;

  try {
    msg = JSON.parse(rawPayload);
  } catch {
    return console.warn("Invalid JSON from user:", userId);
  }

  if (!validateMessage(msg)) {
    return console.warn("Invalid message format", msg);
  }

  const handler = handlers[msg.type];
  if (!handler) {
    return console.warn(`No handler for message type ${msg.type}`);
  }

  handler(userId, msg.payload);
}
