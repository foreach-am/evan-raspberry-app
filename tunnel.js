const childProcess = require('child_process');
const ngrok = require('ngrok');
const axios = require('axios');
require('./configure');

async function sendTunnelUrl(url) {
  const response = await axios.put(process.env.TUNNEL_UPDATE_URL, {
    tunnelUrl: url,
  });

  if (response.status >= 400) {
    return console.error(response);
  }
}

function restart() {
  const options = {
    cwd: global.ROOT_DIR,
  };

  console.log('[TUNNEL] >>> Restarting SSH tunnel.');
  childProcess.exec('npm run restart:runnel', options, function (error) {
    if (error) {
      return console.error('[TUNNEL] >>> Failed to restart app:', error);
    }

    console.log('[TUNNEL] >>> Restart of SSH tunnel successfully completed.');
  });
}

(async function () {
  try {
    const config = {
      authtoken: process.env.NGROK_AUTH_TOKEN,
      proto: 'tcp',
      addr: 22,
      region: 'eu',
    };

    const url = await ngrok.connect(config);
    console.log('[TUNNEL] >>> Station SSH tunnel URL generated.');

    await sendTunnelUrl(url);
    console.log('[TUNNEL] >>> Station SSH tunnel URL updated.');
  } catch (e) {
    console.error();
    console.error(
      '[TUNNEL] >>> Failed to generate/update station tunnel URL:',
      e
    );
    console.error();

    setTimeout(function () {
      restart();
    }, 5_000);
  }
})();
