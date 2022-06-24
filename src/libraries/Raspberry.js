const childProcess = require('child_process');
const { Gpio } = require('onoff');
const { CoreEvent, CoreEventEnum } = require('./CoreEvent');
const { ComEmitter } = require('./ComEmitter');

const state = require('../state');

const buttonReset = new Gpio(5, 'out', 'rising', {
  debounceTimeout: 500,
});

function restartSoftware() {
  return new Promise(function (resolve, reject) {
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
      childProcess.exec('npm run build', options, callback);
    } else {
      console.log('');
      console.log(' Software restart are impossible during development mode.');
      console.log(' Please run `npm start` again to start app.');
      console.log('');

      await restartHardware();

      process.exit(0);
    }
  });
}

function restartHardware() {
  return new Promise(function (resolve, reject) {
    // ComEmitter.extLedOff();

    buttonReset.write(1, function (error, value) {
      if (error) {
        return reject(error);
      }

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

CoreEvent.register(CoreEventEnum.EVENT_USIGNINT, function () {
  led.unexport();
  button.unexport();
});

async function mapOnPlugs(callback) {
  for (let connectorId = 1; connectorId <= state.maxPlugsCount; ++connectorId) {
    callback(connectorId);
  }
}

module.exports = {
  Raspberry: {
    restartSoftware: restartSoftware,
    restartHardware: restartHardware,
    mapOnPlugs: mapOnPlugs,
  },
};
