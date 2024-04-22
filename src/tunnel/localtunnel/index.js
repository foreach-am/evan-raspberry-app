const localtunnel = require('localtunnel');

function randomNumber(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function connectTunnel(onTerminated) {
  const tunnel = await localtunnel({
    port: 22,
    allow_invalid_cert: true,
    subdomain: 'eevan-' + randomNumber(100000, 999999),
  });

  tunnel.on('close', onTerminated);
  return tunnel.url;
}

async function bootstrap() {}

async function canReconnectOnError(error) {}

module.exports.bootstrap = bootstrap;
module.exports.connectTunnel = connectTunnel;
module.exports.canReconnectOnError = canReconnectOnError;
