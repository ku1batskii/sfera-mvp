require('dotenv').config();
const http = require('http');
const expressApp = require('./app');
const initWSS = require('./ws');

const port = process.env.PORT || 3000;

const server = http.createServer(expressApp);
const wss = initWSS(server);

// Make broadcast accessible from routes via app.locals
expressApp.locals.wss = wss;

server.listen(port, () => {
  console.log(`Sfera prototype server listening on http://localhost:${port}`);
});
