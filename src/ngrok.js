const ngrok = require('ngrok');

(async function () {
  const url = await ngrok.connect({
    // authtoken: process.env.NGROK_AUTH_TOKEN,
    proto: 'tcp',
    addr: 22,
    region: 'eu',
  });

  console.log();
  console.log('ngrok url:',url);
  console.log();
})();
