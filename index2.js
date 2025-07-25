const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const os = require('os');

const server = dgram.createSocket('udp4');
const networkInterfaces = os.networkInterfaces();

// Menampilkan IP server
console.log('Daftar IP address server:');
Object.keys(networkInterfaces).forEach((iface) => {
  networkInterfaces[iface].forEach((net) => {
    if (net.family === 'IPv4' && !net.internal) {
      console.log(`- ${iface}: ${net.address}`);
    }
  });
});

// Pastikan direktori logs ada
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Fungsi membersihkan string agar tidak mengandung karakter aneh
function cleanString(str) {
  return str.replace(/[^\x20-\x7E]/g, '');
}

// Fungsi menulis ke file per-topic
function writeLogPerTopic(topic, dataObj) {
  const safeFilename = topic.replace(/\//g, '_') + '.log'; // ex: pp/hsi → pp_hsi.log
  const filepath = path.join(logsDir, safeFilename);

  const line = JSON.stringify(dataObj) + '\n';

  fs.appendFile(filepath, line, (err) => {
    if (err) console.error(`Gagal menulis ke file ${filepath}:`, err);
  });
}

server.on('message', (msg, rinfo) => {
  const str = msg.toString('utf8');
  const cleanedStr = cleanString(str);

  const firstComma = cleanedStr.indexOf(',');
  let topic = '', data = '';
  if (firstComma !== -1) {
    topic = cleanedStr.substring(0, firstComma);
    data = cleanedStr.substring(firstComma + 1);
  } else {
    topic = cleanedStr;
    data = '';
  }

  const parsed = {
    topic,
    data: data.split(','),
    info: {
      from_ip: rinfo.address,
      from_port: rinfo.port
    }
  };

  console.log(JSON.stringify(parsed, null, 2));

  // Simpan berdasarkan topic
  writeLogPerTopic(topic, parsed);

  // Balasan (opsional)
  server.send('Hello from server', rinfo.port, rinfo.address);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`Server listening ${address.address}:${address.port}`);
});

server.bind(41234);
