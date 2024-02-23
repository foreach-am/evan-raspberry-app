const { execSync } = require('child_process');

function runCommand(command) {
  console.log(` >>> Running job: "${command}"`);
  execSync(command, {
    cwd: __dirname,
  });
}

function register(command, minutes) {
  console.log(`Job registered: ${minutes} minutes - "${command}"`);
  setInterval(function () {
    runCommand(command);
  }, minutes * 60 * 1000);
}

process.on('uncaughtException', (err) => {
  console.error();
  console.error('Uncaught Exception:', err);
  console.error();
});

// execute on start
runCommand('npm run tool:update-macaddress');

// jobs ...
register('npm run tool:update-source-code', 12 * 60); // twice daily
