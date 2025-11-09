import express from 'express';
import config from './config/config.js';

const app = express();
const port = config.port;

// Basic health check route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});