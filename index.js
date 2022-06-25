global.ROOT_DIR = __dirname;

function startClientApplication() {
  require('./src/configure');
  require('./src/client');
  require('./src/lighting');
}

let intervalSteps = 30;

const interval = setInterval(function () {
  console.log(`  CLIENT APP WILL START IN ${intervalSteps} SECONDS.`);

  if (--intervalSteps === 0) {
    console.log();
    console.log();
    console.log();

    clearInterval(interval);
    startClientApplication();
  }
}, 1000);
