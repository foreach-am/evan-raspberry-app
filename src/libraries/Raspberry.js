const { Gpio } = require('onoff');
const { CoreEvent, CoreEventEnum } = require('./CoreEvent');
const { ComPort, Emitter } = require('./ComPort');

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
    // Emitter.extLedOff();

    buttonReset.write(1, function (error, value) {
      if (error) {
        return reject(error);
      }

      buttonReset.write(0, function (error, value) {
        if (error) {
          return reject(error);
        }

        Emitter.startRun();
        Emitter.extLedOn();

        resolve();
      });
    });
  });
}

CoreEvent.register(CoreEventEnum.EVENT_USIGNINT, function () {
  led.unexport();
  button.unexport();
});

module.exports = {
  Raspberry: {
    restartSoftware: restartSoftware,
    restartHardware: restartHardware,
  },
};
