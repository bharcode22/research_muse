const { Server } = require('ws');
const OSC = require('osc-js');
const os = require('os');

const wss = new Server({ port: 8080 });
console.log('WebSocket running at ws://localhost:8080');

let totalMessages = 0;
let topicsSeen = new Set();

// OSC client listener
const osc = new OSC({ plugin: new OSC.DatagramPlugin({ open: { port: 41234 } }) });

osc.on('/pp/example', message => {
  const numericValues = message.args.map(arg => parseFloat(arg));
  const topic = '/pp/example';
  const timestamp = new Date().toISOString();

  const payload = {
    topic,
    numericValues,
    timestamp,
    dataType: 'OSC',
    detectedPattern: null
  };

  totalMessages++;
  topicsSeen.add(topic);

  // Kirim ke semua WebSocket client
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(payload));
    }
  });
});

osc.open();

// Kirim info saat client connect
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.send(JSON.stringify({ type: 'info', message: 'Connected to OSC bridge' }));

  // Statistik kirim setiap 5 detik
  const interval = setInterval(() => {
    const stats = {
      type: 'stats',
      statistics: {
        totalMessages,
      },
      topics: Array.from(topicsSeen),
      systemInfo: {
        freeMem: os.freemem(),
        load: os.loadavg(),
      }
    };
    ws.send(JSON.stringify(stats));
  }, 5000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});
