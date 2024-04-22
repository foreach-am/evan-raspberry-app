const fs = require('node:fs');
const os = require('node:os');
const ngrok = require('ngrok');

// const configFile = '/home/admin/.config/ngrok/ngrok.yml';
const configFile = '/home/admin/.ngrok2/ngrok.yml';

async function connectTunnel(onTerminated) {
  const url = await ngrok.connect({
    authtoken: process.env.NGROK_AUTH_TOKEN,
    proto: 'tcp',
    addr: 22,
    region: 'eu',
    configPath: configFile,
    onTerminated: onTerminated,
  });

  return url;
}

async function configureYaml() {
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

async function bootstrap() {
  console.log('[TUNNEL] >>> configuring ngrok tunnel.');
  await configureYaml(configFile);
  console.log('[TUNNEL] >>> configuration completed.');
}

async function canReconnectOnError(error) {
  if (error.name === 'RequestError' && error.code === 'ECONNREFUSED') {
    const patterns = [
      /^connect ECONNREFUSED 127\.0\.0\.1/,
      /^connect ECONNREFUSED ::1/,
      /^connect ECONNREFUSED 192\.168\.\d+\.\d+$/,
    ];

    for (const pattern of patterns) {
      if (pattern.test(error.message)) {
        return false;
      }
    }
  }

  return true;
}

module.exports.bootstrap = bootstrap;
module.exports.connectTunnel = connectTunnel;
module.exports.canReconnectOnError = canReconnectOnError;
