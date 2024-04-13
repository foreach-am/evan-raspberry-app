const serveonet = require('serveonet');

function connectTunnel(onTerminated) {
  return new Promise((resolve) => {
    const tunnel = serveonet({
      localHost: 'localhost',
      localPort: 22,
      serverAliveInterval: 60,
      serverAliveCountMax: 3,
    })
      .on('connect', (connection) => {
        resolve(connection.remoteSubdomain);
        console.log(connection);
      })
      .on('timeout', onTerminated)
      .on('error', onTerminated)
      .on('close', onTerminated);
  });
}

async function bootstrap() {}

module.exports.bootstrap = bootstrap;
module.exports.connectTunnel = connectTunnel;
