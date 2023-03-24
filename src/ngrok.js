const ngrok = require('ngrok');
const axios = require('axios');

async function sendTunnelUrl(url) {
  const response = await axios.put(process.env.TUNNERL_UPDATE_URL, {
    tunnelUrl: url,
  });

  if (response.status >= 400) {
    return console.error(response);
  }
}

(async function () {
  try {
    const url = await ngrok.connect({
      authtoken: process.env.NGROK_AUTH_TOKEN,
      proto: 'tcp',
      addr: 22,
      region: 'eu',
    });

    await sendTunnelUrl(url);
  } catch (e) {
    console.error();
    console.error('Failed tu update station tunnel URL:', e);
    console.error();
  }
})();
