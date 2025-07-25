const osc = require("osc");

// Buat client OSC untuk kirim ke localhost:41234
const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",     // port lokal opsional (biarkan otomatis)
  localPort: 0,                // biarkan 0 agar port otomatis
  remoteAddress: "192.168.1.103",  // ganti dengan IP tujuan jika perlu
//   remoteAddress: "localhost",  // ganti dengan IP tujuan jika perlu
  remotePort: 41234
});

// Buka port
udpPort.open();

udpPort.on("ready", () => {
  console.log("✅ OSC Client ready, sending message...");

  udpPort.send({
    address: "/pp/example", // Alamat OSC, harus diawali dengan '/'
    args: [
      {
        type: "s",   // type 's' = string
        value: "masih hidup"
      }
    ]
  });

  setTimeout(() => {
    udpPort.close();
    console.log("🛑 OSC Client socket closed");
  }, 200);
});
