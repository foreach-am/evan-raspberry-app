global.ROOT_DIR = __dirname;

function startClientApplication() {
  require('./src/configure');
  require('./src/client');
  require('./src/lighting');
}

let intervalSteps = 5;

const interval = setInterval(function () {
  console.clear();
  console.log();
  console.log('  We need to wait a bit till COM-port can respond us, please wait ...');
  console.log(`  Client app will start after ${intervalSteps} seconds.`);
  console.log();

  if (--intervalSteps === 0) {
    console.clear();
    console.log();

    clearInterval(interval);
    startClientApplication();
  }
}, 1_000);
