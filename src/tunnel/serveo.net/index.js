const connect = require('./connect');

function connectTunnel(onTerminated) {
  return new Promise((resolve) => {
    connect({
      localHost: 'localhost',
      localPort: 22,
      remotePort: 80,
      serverAliveInterval: 60,
      serverAliveCountMax: 3,
    })
      .on('connect', (connection) => {
        resolve(connection.remoteSubdomain);
        console.log(connection);
      })
      .on('timeout', (...args) => onTerminated('timeout', ...args))
      .on('error', (...args) => onTerminated('error', ...args))
      .on('close', (...args) => onTerminated('close', ...args));
  });
}

async function bootstrap() {}

module.exports.bootstrap = bootstrap;
module.exports.connectTunnel = connectTunnel;
