import http from 'http';
import createWebSocketServer from "./server/websocket.js";
import { initRedisSubscriber } from './pubsub/subscriber.js';

const app = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Web Socket server is running.');
});

initRedisSubscriber();

createWebSocketServer(app);

export default app;

