/* eslint-disable no-console */

const fs = require('fs');
const childProcess = require('child_process');
const { Gpio } = require('onoff');
const { getFilePath } = require('./DataManager');
const { CoreEvent, CoreEventEnum } = require('./CoreEvent');
const { ComEmitter } = require('./ComEmitter');

const state = require('../state');

const buttonReset = new Gpio(5, 'out', 'rising', {
  debounceTimeout: 500,
});

function logDateAndTime() {
  const filePath = getFilePath('charge-datetime.data');
  const current = new Date().toISOString();

  fs.writeFileSync(filePath, current, 'utf-8');
}

function getLastDateTime() {
  const filePath = getFilePath('charge-datetime.data');
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, 'utf-8');
}

async function restartSoftware() {
  return new Promise(async function (resolve, reject) {
    const callback = function (error, stdout, stderr) {
      if (error) {
        return reject(error);
      }
      if (stderr) {
        return reject(stderr);
      }

      resolve();
    };

    const options = {
      cwd: global.ROOT_DIR,
    };

    if (process.env.NODE_ENV === 'production') {
      childProcess.exec('npm run restart', options, callback);
    } else {
      console.log('');
      console.log(' Software restart are impossible during development mode.');
      console.log(
        ' Please kill current process Ctrl+C, then run start command'
      );
      console.log(' again `npm start` to start app.');
      console.log('');

      process.exit(1_000_001);
    }
  });
}

async function restartHardware() {
  return new Promise(function (resolve, reject) {
    ComEmitter.extLedOff();

    // eslint-disable-next-line  no-unused-vars
    buttonReset.write(1, function (error, value) {
      if (error) {
        return reject(error);
      }

      // eslint-disable-next-line  no-unused-vars
      buttonReset.write(0, function (error, value) {
        if (error) {
          return reject(error);
        }

        ComEmitter.startRun();
        ComEmitter.extLedOn();

        resolve();
      });
    });
  });
}

CoreEvent.register(CoreEventEnum.EVENT_SIGINT, function () {
  buttonReset.unexport();
});

async function mapOnPlugs(callback) {
  for (let connectorId = 1; connectorId <= state.maxPlugsCount; ++connectorId) {
    callback(connectorId);
  }
}

module.exports = {
  Raspberry: {
    logDateAndTime: logDateAndTime,
    getLastDateTime: getLastDateTime,
    restartSoftware: restartSoftware,
    restartHardware: restartHardware,
    mapOnPlugs: mapOnPlugs,
  },
};
