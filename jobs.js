const { execSync } = require('child_process');

function register(command, minutes) {
  console.log(`Job registered: ${minutes} minutes - "${command}"`);
  setInterval(function () {
    execSync(command, {
      cwd: __dirname,
    });
  }, minutes * 60 * 1000);
}

process.on('uncaughtException', (err) => {
  console.error();
  console.error('Uncaught Exception:', err);
  console.error();
});

// jobs ...
register('npm run tool:update-source-code', 1);
