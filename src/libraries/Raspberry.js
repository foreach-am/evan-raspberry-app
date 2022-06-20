const { Gpio } = require('onoff');
const { CoreEvent, CoreEventEnum } = require('./CoreEvent');
const { ComEmitter } = require('./ComEmitter');

const state = require('../state');

const buttonReset = new Gpio(5, 'out', 'rising', {
  debounceTimeout: 500,
});

function restartSoftware() {
  return new Promise(function (resolve, reject) {
    // @TODO: restart software.
    resolve();
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
    await callback(connectorId);
  }
}

module.exports = {
  Raspberry: {
    restartSoftware: restartSoftware,
    restartHardware: restartHardware,
    mapOnPlugs: mapOnPlugs,
  },
};
