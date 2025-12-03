import http from 'http';
import createWebSocketServer from "./server/websocket.js";
import authMiddleware from './middleware/auth.middleware.js';

const app = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Web Socket server is running.');
});

const wss = createWebSocketServer({ clientTracking: true, noServer: true });

app.on('upgrade', async function(request, socket, head) {
  await authMiddleware(request, socket, head, wss);
});

app.closeAsync = async () => {
  await wss.closeAsync();
  wss.close();
}

export default app;

