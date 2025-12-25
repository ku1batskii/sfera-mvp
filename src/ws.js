const WebSocket = require('ws');

function initWSS(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('WS client connected');
    ws.send(JSON.stringify({ type: 'welcome', ts: new Date().toISOString() }));

    ws.on('message', (msg) => {
      // For now we don't handle incoming messages from clients
      // Future: client subscriptions, auth, pings
    });

    ws.on('close', () => console.log('WS client disconnected'));
  });

  return wss;
}

module.exports = initWSS;
