import http from 'http';
import createWebSocketServer from "./server/websocket.js";

const app = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Web Socket server is running.');
});

createWebSocketServer(app);

export default app;

