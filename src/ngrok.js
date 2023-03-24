const ngrok = require('ngrok');
const request = require('request');

function sendTunnelUrl(url) {
  const options = {
    url: process.env.TUNNERL_UPDATE_URL,
    json: true,
    body: {
      tunnelUrl: url,
    },
  };

  request.post(options, (err, res, body) => {
    if (err) {
      return console.error(err);
    }

    console.log(`Status: ${res.statusCode}`);
    console.log(body);
  });
}

(async function () {
  try {
    const url = await ngrok.connect({
      authtoken: process.env.NGROK_AUTH_TOKEN,
      proto: 'tcp',
      addr: 22,
      region: 'eu',
    });

    sendTunnelUrl(url);
  } catch (e) {
    console.error();
    console.error('Failed tu update station tunnel URL:', e);
    console.error();
  }
})();
