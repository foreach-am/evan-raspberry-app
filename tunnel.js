const https = require('node:https');
const fs = require('node:fs');
const os = require('node:os');
const ngrok = require('ngrok');
const axios = require('axios');
require('./configure');

async function sendTunnelUrl(url) {
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
}

async function connectTunnel(configFile) {
  try {
    const url = await ngrok.connect({
      authtoken: process.env.NGROK_AUTH_TOKEN,
      proto: 'tcp',
      addr: 22,
      region: 'eu',
      configPath: configFile,
    });

    console.log('[TUNNEL] >>> tunnel url ready:', url);
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

async function configureYaml(configFile) {
  await ngrok.upgradeConfig({
    relocate: false,
    configPath: configFile,
  });

  const configureKeyValue = function (key, value) {
    if (!value) {
      return;
    }

    if (!fs.existsSync(configFile)) {
      fs.writeFileSync(configFile, '', 'utf8');
    }

    const oldContent = !fs.existsSync(configFile)
      ? ''
      : fs.readFileSync(configFile, 'utf8');

    const oldLines = oldContent.split(os.EOL).filter(function (line) {
      return !!line;
    });

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
    if (newContent !== oldContent) {
      try {
        fs.writeFileSync(configFile, newContent, 'utf8');
      } catch (e) {
        console.error('Not configured', e);
      }
    }
  };

  configureKeyValue('authtoken', process.env.NGROK_AUTH_TOKEN);
  configureKeyValue('region', 'eu');
  configureKeyValue('version', '2');
}

(async function () {
  // const configFile = '/home/admin/.config/ngrok/ngrok.yml';
  const configFile = '/home/admin/.ngrok2/ngrok.yml';

  console.log('[TUNNEL] >>> configuring ngrok tunnel.');
  await configureYaml(configFile);
  console.log('[TUNNEL] >>> configuration completed.');

  console.log('[TUNNEL] >>> opening tunnel.');
  await connectTunnel(configFile);
})();
