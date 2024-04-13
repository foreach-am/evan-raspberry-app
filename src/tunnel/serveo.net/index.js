const { spawn } = require('child_process');

function connectTunnel(onTerminated) {
  return new Promise((resolve) => {
    const commandArguments = [
      '-T',
      '-R 80:localhost:22',
      '-o ExitOnForwardFailure=yes',
      '-o StrictHostKeyChecking=no',
      '-o ServerAliveInterval=60',
      '-o ServerAliveCountMax=3',
      'serveo.net',
    ];

    spawn('ssh', commandArguments).stdout.on('data', (data) => {
      const domainPattern = /(https\:\/\/[a-z0-9.-]+\.serveo\.net)/gi;
      const domainMatches = data.toString().match(domainPattern);

      if (Array.isArray(domainMatches) && domainMatches.length > 0) {
        resolve(domainMatches[0]);
      }
    });
  });
}

async function bootstrap() {}

module.exports.bootstrap = bootstrap;
module.exports.connectTunnel = connectTunnel;
