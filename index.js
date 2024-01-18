require('./configure');

global.ROOT_DIR = __dirname;

function startClientApplication() {
  require('./src/client');
  require('./src/lighting');
}

let intervalSteps = 3;
function printTimerEmpty() {
  console.clear();
  console.log();
  console.log();
  console.log('  We need to wait a bit till COM-port can respond us.');
  console.log('  Please wait ...');
  console.log();
  console.log(`  Client app will start after ${intervalSteps} seconds.`);
  console.log();
  console.log();
}

function startApplication() {
  const interval = setInterval(function () {
    printTimerEmpty();
    if (--intervalSteps === 0) {
      console.clear();
      console.log();

      clearInterval(interval);
      startClientApplication();
    }
  }, 1_000);
}

process.on('uncaughtException', (err) => {
  console.error();
  console.error('Uncaught Exception:', err);
  console.error();
});

startApplication();
