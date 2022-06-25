global.ROOT_DIR = __dirname;

function startClientApplication() {
  require('./src/configure');
  require('./src/client');
  require('./src/lighting');
}

let intervalSteps = 30;

const interval = setInterval(function () {
  console.clear();
  console.log();
  console.log(`  Client app will start after ${intervalSteps} seconds, please wait ...`);

  if (--intervalSteps === 0) {
    console.clear();
    console.log();

    clearInterval(interval);
    startClientApplication();
  }
}, 1000);
