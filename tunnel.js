const fs = require('node:fs');
const os = require('node:os');
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

async function connectTunnel() {
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
      connectTunnel();
    }, 5_000);
  }
}

async function configureYaml() {
  const configFile = `${process.env.HOME}/.ngrok2/ngrok.yml`;

  const configureKeyValue = function (key, value) {
    if (!fs.existsSync()) {
      fs.writeFileSync(configFile, '', 'utf8');
    }

    const oldContent = fs.readFileSync(configFile, 'utf8');
    const oldLines = oldContent.split(os.EOL);

    let found = false;
    const newLines = oldLines.map(function (line) {
      if (!line || !line.startsWith(`${key}:`)) {
        return line;
      }

      found = true;
      return `${key}: ${value}`;
    });

    if (!found) {
      newLines.push(`${key}: ${value}`);
    }

    const newContent = newLines.join(os.EOL);
    console.log({ newContent, oldContent });
    if (newContent !== oldContent) {
      fs.writeFileSync(configFile, newContent, 'utf8');
    }
  };

  configureKeyValue('authtoken', process.env.NGROK_AUTH_TOKEN);
  configureKeyValue('version', '2');
}

(async function () {
  await configureYaml();
  await connectTunnel();
})();
