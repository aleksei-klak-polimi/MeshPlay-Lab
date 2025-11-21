import { publishToService } from "../pubsub/publisher.js";

export default function systemHandler( userId, payload ) {

  publishToService("ws.outgoing", { userId, payload : "Pong" });

}
