/* eslint-disable no-console */

const childProcess = require('child_process');
const { Gpio } = require('onoff');
const { CoreEvent, CoreEventEnum } = require('./CoreEvent');
const { ComEmitter } = require('./ComEmitter');
const { Reboot } = require('./OfflineManager');
const {Logger} = require('./Logger');

const state = require('../state');

const buttonReset = new Gpio(5, 'out', 'rising', {
  debounceTimeout: 500,
});

const RebootSoftwareReasonEnum = {
  COMPORT_STUCK: 1,
  BY_OCPP_PROTOCOL: 2,
};

async function restartSoftware(reason = null) {
  if (reason) {
    Reboot.putReason(reason);
  }

  return new Promise(async function (resolve, reject) {
    const options = {
      cwd: global.ROOT_DIR,
    };

    if (process.env.NODE_ENV === 'production') {
      Logger.info('Restarting engine with options:', options);
      console.log(childProcess.execSync('npm run restart:app || pmr restart app', options));
      resolve();
    } else {
      console.log('');
      console.log(' Software restart are impossible during development mode.');
      console.log(
        ' Please kill current process Ctrl+C, then run start command'
      );
      console.log(' again `npm start` to start app.');
      console.log('');

      process.exit(1_000_001);
      reject();
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

function mapOnPlugs(callback) {
  for (let connectorId = 1; connectorId <= state.maxPlugsCount; ++connectorId) {
    callback(connectorId);
  }
}

module.exports = {
  RebootSoftwareReasonEnum: RebootSoftwareReasonEnum,
  Raspberry: {
    restartSoftware: restartSoftware,
    restartHardware: restartHardware,
    mapOnPlugs: mapOnPlugs,
  },
};
