const localtunnel = require('localtunnel');

async function connectTunnel(onTerminated) {
  const tunnel = await localtunnel({ port: 3000 });
  tunnel.on('close', onTerminated);

  return tunnel.url;
}

async function bootstrap() {}

module.exports.bootstrap = bootstrap;
module.exports.connectTunnel = connectTunnel;
