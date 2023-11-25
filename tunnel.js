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
    fs.writeFileSync(
      logFile,
      `Station SSH tunnel URL generated: ${url}`,
      'utf-8'
    );

    await sendTunnelUrl(url);
    fs.writeFileSync(logFile, 'Station SSH tunnel URL updated.', 'utf-8');
  } catch (e) {
    console.error();
    console.error(
      '[TUNNEL] >>> Failed to generate/update station tunnel URL:',
      e
    );
    console.error();

    fs.writeFileSync(
      logFile,
      `Failed to generate/update station tunnel URL: ${e}`,
      'utf-8'
    );

    setTimeout(function () {
      connect();
    }, 5_000);
  }
}

(async function () {
  fs.rmSync(logFile);
  await connect();
})();
