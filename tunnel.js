const path = require('path');
const fs = require('fs');
const ngrok = require('ngrok');
const axios = require('axios');
require('./configure');

const logFile = path.join(__dirname, 'tunnel.log');

async function sendTunnelUrl(url) {
  const response = await axios.put(process.env.TUNNEL_UPDATE_URL, {
    tunnelUrl: url,
  });

  if (response.status >= 400) {
    return console.error(response);
  }
}

async function connect() {
  try {
    const config = {
      authtoken: process.env.NGROK_AUTH_TOKEN,
      proto: 'tcp',
      addr: 22,
      region: 'eu',
    };

    const url = await ngrok.connect(config);
    await sendTunnelUrl(url);
  } catch (e) {
    console.error();
    console.error(
      '[TUNNEL] >>> Failed to generate/update station tunnel URL:',
      e
    );
    console.error();

    setTimeout(function () {
      connect();
    }, 5_000);
  }
}

(async function () {
  fs.rmSync(logFile);
  await connect();
})();
