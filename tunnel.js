const https = require('node:https');
const axios = require('axios');
require('./configure');

const tunnel = require('./src/tunnel/ngrok');

async function sendTunnelUrl(url) {
  try {
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
  } catch (e) {
    console.log('[TUNNEL] >>> tunnel response', e.data || e.response?.data);
    throw e;
  }
}

async function onTerminated() {
  console.log('[TUNNEL] >>> tunnel terminated, reconnecting ...');
  await connectTunnel();
}

async function connectTunnel() {
  try {
    console.log('[TUNNEL] >>> opening tunnel.');
    const url = await tunnel.connectTunnel(onTerminated);

    await sendTunnelUrl(url);
    console.log('[TUNNEL] >>> tunnel url ready:', url);
  } catch (e) {
    console.error('[TUNNEL] >>> Failed to generate/update station tunnel URL');
    console.error(e);

    setTimeout(function () {
      connectTunnel();
    }, 5_000);
  }
}

(async function () {
  await tunnel.bootstrap();
  await connectTunnel();
})();
