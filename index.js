global.ROOT_DIR = __dirname;

// function fetchLatestVersion() {
//   try {
//     const commands = ['git reset --hard', 'git pull'];
//     require('child_process').execSync(commands.join(' && '), {
//       cwd: __dirname,
//       encoding: 'utf-8',
//     });
//   } catch (e) {
//     console.error();
//     console.error('>>> FAILED TO FETCH LATEST VERSION OF SOURCE CODE.');
//     console.error(e);
//     console.error();
//   }
// }

function startClientApplication() {
  require('./src/configure');
  require('./src/client');
  require('./src/lighting');
}

let intervalSteps = 5;
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

// fetchLatestVersion();
startApplication();
