import http from 'http';
import createWebSocketServer from "./server/websocket.js";
import authMiddleware from './middleware/auth.middleware.js';
import config from './config/config.js';


// Api docs html logic
const docsExposer = {
  serveDocsUtil: await (async function () {
    if (config.env === 'development') {
      const { serveDocs } = await import('./utils/serveDocs.js');
      return serveDocs;
    }
    return null;
  })(),

  serveDocs(req, res) {
    //If dev environment then expose docs
    if (config.env === 'development' && req.url.split('/')[1] === 'asyncapi') {
      if (!this.serveDocsUtil) return false;

      const filePath = function () {
        const parts = req.url.split('/').filter(Boolean);
        return "/" + parts.slice(1).join("/");
      }()

      this.serveDocsUtil(req, res, filePath);
      return true;
    } else return false;
  }
}


// ---- WebSocket + HTTP server ----
const app = http.createServer((req, res) => {

  if (docsExposer.serveDocs(req, res))
    return;
  else {
    res.writeHead(200);
    res.end('Web Socket server is running.');
  }
});

const wss = createWebSocketServer({ clientTracking: true, noServer: true });

app.on('upgrade', async function (request, socket, head) {
  await authMiddleware(request, socket, head, wss);
});

app.closeAsync = async () => {
  await wss.closeAsync();
  wss.close();
}

export default app;