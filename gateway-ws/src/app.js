import http from 'http';
import createWebSocketServer from "./server/websocket.js";
import authMiddleware from './middleware/auth.middleware.js';
import config from './config/config.js';
import { createRedis, closeRedis } from './config/redis.js';
import { serveDocs } from './utils/serveDocs.js';


// ---- WebSocket + HTTP server ----
const app = http.createServer((req, res) => {

  if(req.url.split('/')[1] === 'asyncapi' && exposeDocs(req, res))
    return;

  else {
    res.writeHead(200);
    res.end('Web Socket server is running.');
  }
});

const redisPub = createRedis();
const redisSub = createRedis();
const wss = await createWebSocketServer({ clientTracking: true, noServer: true }, {redisPub, redisSub});

app.on('upgrade', async function (request, socket, head) {
  await authMiddleware(request, socket, head, wss);
});

app.closeAsync = async () => {
  await wss.closeAsync();
  wss.close();
  await closeRedis(redisPub);
  await closeRedis(redisSub);
}


// Api docs html logic
function exposeDocs(req, res){
  if(config.env === 'development'){
    serveDocs(req, res);
    return true;
  } else return false;
}


export default app;