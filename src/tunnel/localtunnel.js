const localtunnel = require('localtunnel');

async function connectTunnel(onTerminated) {
  const tunnel = await localtunnel({
    port: 22,
    allow_invalid_cert: true,
    subdomain: 'embers',
  });

  tunnel.on('close', onTerminated);
  return tunnel.url;
}

async function bootstrap() {}

module.exports.bootstrap = bootstrap;
module.exports.connectTunnel = connectTunnel;
