const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const message = Buffer.from('pp/example,masih hidup');

client.send(message, 41234, 'localhost', (err) => {
  if (err) {
    console.error('Send error:', err);
    client.close();
  } else {
    console.log('Message sent to UDP server');
    setTimeout(() => {
      client.close();
      console.log('Client socket closed');
    }, 100);
  }
});
