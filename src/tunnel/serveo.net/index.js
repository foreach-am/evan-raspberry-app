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

    const { stdout } = spawn('ssh', commandArguments);

    stdout.on('data', (data) => {
      const domainPattern = /(https\:\/\/[a-z0-9.-]+\.serveo\.net)/gi;
      const domainMatches = data.toString().match(domainPattern);

      if (Array.isArray(domainMatches) && domainMatches.length > 0) {
        resolve(domainMatches[0]);
      } else {
        console.log(data);
      }
    });

    stdout.on('close', (...args) => {
      console.log('close:', ...args);
    });
    stdout.on('end', (...args) => {
      console.log('end:', ...args);
    });
    stdout.on('error', (...args) => {
      console.log('error:', ...args);
    });
    stdout.on('pause', (...args) => {
      console.log('pause:', ...args);
    });
  });
}

async function bootstrap() {}

async function canReconnectOnError(error) {}

module.exports.bootstrap = bootstrap;
module.exports.connectTunnel = connectTunnel;
module.exports.canReconnectOnError = canReconnectOnError;
