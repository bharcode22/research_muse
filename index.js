const dgram = require('dgram');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');

const server = dgram.createSocket('udp4');
const wss = new WebSocket.Server({ port: 8080 });

// Setup log directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

// Function to clean the incoming message
function cleanString(str) {
  return str.replace(/[^\x20-\x7E]/g, ''); // remove non-printable characters
}

// Function to convert string data to numeric values
function convertToNumeric(data) {
  return data.map(item => {
    // Try to parse as float first
    const num = parseFloat(item);
    if (!isNaN(num)) return num;
    
    // If not a number, calculate ASCII sum
    return item.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  });
}

// Function to detect data type and format accordingly
function formatData(topic, rawData) {
  // Common data patterns
  // const patterns = {
  //   eeg: /^[a-zA-Z0-9+/=]+$/, // Base64-like
  //   ppg: /^[a-fA-F0-9]+$/,     // Hex-like
  //   thermistor: /^\d+\.?\d*$/  // Numeric
  // };

  // Default conversion
  let numericValues = convertToNumeric(rawData);
  
  // Special handling for known topics
  if (topic.includes('eeg')) {
    // EEG specific processing
    numericValues = rawData.map(item => {
      // Example: Take first 3 characters ASCII average
      return item.slice(0, 3).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) / 3;
    });
  } else if (topic.includes('ppg')) {
    // PPG specific processing
    numericValues = rawData.map(item => {
      // Example: Use string length as base value
      return item.length * 10;
    });
  } else if (topic.includes('thermistor')) {
    // Thermistor specific processing
    numericValues = rawData.map(item => {
      // Try to parse as float, use ASCII value if fails
      const num = parseFloat(item);
      return isNaN(num) ? item.charCodeAt(0) : num;
    });
  }

  return {
    raw: rawData,
    numeric: numericValues,
    timestamp: new Date().toISOString()
  };
}

// Function to write logs per topic
function writeLogPerTopic(topic, dataObj) {
  const safeFilename = topic.replace(/\//g, '_') + '.log';
  const filepath = path.join(logsDir, safeFilename);
  const line = JSON.stringify(dataObj) + '\n';
  fs.appendFile(filepath, line, err => {
    if (err) console.error(`Failed to write to ${filepath}`, err);
  });
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`🔌 WebSocket client connected from ${ip}`);
  ws.send(JSON.stringify({ 
    type: 'info', 
    message: '✅ Connected to WebSocket server',
    supportedFormats: ['eeg', 'ppg', 'thermistor']
  }));
});

// Broadcast data to all WebSocket clients
function broadcastToClients(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

server.on('message', (msg, rinfo) => {
  try {
    const str = msg.toString('utf8');
    const cleanedStr = cleanString(str);

    const firstComma = cleanedStr.indexOf(',');
    let topic = '', data = '';
    if (firstComma !== -1) {
      topic = cleanedStr.substring(0, firstComma);
      data = cleanedStr.substring(firstComma + 1).split(',');
    } else {
      topic = cleanedStr;
      data = [''];
    }

    // Format data based on topic
    const formattedData = formatData(topic, data);

    const parsed = {
      topic,
      ...formattedData,
      info: {
        from_ip: rinfo.address,
        from_port: rinfo.port
      }
    };

    console.log('📨 Received and formatted message:');
    console.log(JSON.stringify(parsed, null, 2));

    // Write logs for each topic
    writeLogPerTopic(topic, parsed);

    // Broadcast formatted data to WebSocket clients
    broadcastToClients({
      topic,
      rawValues: formattedData.raw,
      numericValues: formattedData.numeric,
      timestamp: formattedData.timestamp,
      dataType: topic.split('/').pop() // Extract data type from topic
    });

    server.send('ACK', rinfo.port, rinfo.address);
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

server.on('listening', () => {
  const address = server.address();
  console.log(`UDP Server listening ${address.address}:${address.port}`);
  console.log(`WebSocket server available at ws://${getLocalIPAddress()}:8080`);
});

// Helper function to get local IP
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Bind to UDP port 41234
server.bind(41234);