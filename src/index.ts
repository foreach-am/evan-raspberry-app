import configure from './bootstrap/configure';
import lighting from './bootstrap/lighting';
import runClient from './bootstrap/client';

let intervalSteps = 15;

function logMessage() {
  console.clear();
  console.log();
  console.log('  We need to wait a bit till COM-port can respond us, please wait ...');
  console.log(`  Client app will start after ${intervalSteps} seconds.`);
  console.log();
}

function startClientApplication() {
  configure();
  lighting();
  runClient();
}

const interval = setInterval(function () {
  logMessage();

  if (--intervalSteps === 0) {
    console.clear();
    console.log();

    clearInterval(interval);
    startClientApplication();
  }
}, 1000);
