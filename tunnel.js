const https = require('node:https');
const axios = require('axios');
require('./configure');

const tunnel = require('./src/tunnel/ngrok');
// const tunnel = require('./src/tunnel/localtunnel');
// const tunnel = require('./src/tunnel/serveo.net');

async function sendTunnelUrl(url) {
  try {
    console.log('[TUNNEL] >>> saving tunnel url:', {
      tunnel: url,
      save: process.env.TUNNEL_UPDATE_URL,
    });

    const response = await axios.put(
      process.env.TUNNEL_UPDATE_URL,
      {
        tunnelUrl: url,
      },
      {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      }
    );

    if (response.status >= 400) {
      return console.error(response);
    }
    console.log('[TUNNEL] >>> tunnel url saved');
  } catch (e) {
    console.log('[TUNNEL] >>> tunnel response', e.data || e.response?.data);
    throw e;
  }
}

async function onTerminated() {
  console.log('[TUNNEL] >>> tunnel terminated.');
}

async function connectTunnel() {
  try {
    console.log('[TUNNEL] >>> opening tunnel.');
    let url = await tunnel.connectTunnel(onTerminated);
    url = url
      .replace('tcp://', '')
      .replace('https://', '')
      .replace('http://', '');

    await sendTunnelUrl(url);
  } catch (e) {
    console.error('[TUNNEL] >>> Failed to generate/update station tunnel URL');
    console.error(e);

    const canReconnect = await tunnel.canReconnectOnError(e);
    const reconnectionInterval = canReconnect
      ? 60 // every minute
      : 3600 * 12; // twice daily

    console.error(
      `[TUNNEL] >>> reconnection after ${reconnectionInterval} seconds.`
    );

    setTimeout(function () {
      connectTunnel();
    }, reconnectionInterval * 1000);
  }
}

(async function () {
  await tunnel.bootstrap();
  await connectTunnel();
})();
