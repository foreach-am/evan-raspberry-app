const { Gpio } = require('onoff');
const { CoreEvent, CoreEventEnum } = require('./CoreEvent');
const { ComPort } = require('./libraries/ComPort');

const buttonReset = new Gpio(5, 'out', 'rising', {
  debounceTimeout: 500,
});

function restartSoftware() {
  return new Promise(function (resolve, reject) {
    // @TODO: restart software.
  });
}

function restartHardware() {
  return new Promise(function (resolve, reject) {
    ComPort.emit(`EXTLEDON:`);
    buttonReset.write(1, function (error, value) {
      ComPort.emit(`EXTLEDOFF:`);

      if (error) {
        return reject(error);
      }

      buttonReset.write(0, function (error, value) {
        if (error) {
          return reject(error);
        }

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
