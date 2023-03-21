const { CoreEvent, CoreEventEnum } = require('../../libraries/CoreEvent');
const { ComPort } = require('../../libraries/ComPort');
const { ComEmitter } = require('../../libraries/ComEmitter');
const { Raspberry } = require('../../libraries/Raspberry');
const { Logger } = require('../../libraries/Logger');

let restartComportAttempts = 0;
ComPort.onLongIdle(async function () {
  Logger.info('ComPort stuck, no data received long time.');

  if (++restartComportAttempts === 4) {
    Logger.info('Calling hardware and software reset ...');

    await Raspberry.restartHardware();
    await Raspberry.restartSoftware();

    ComPort.close();
  } else {
    Logger.info('Restarting comport ...');

    ComPort.close();
    ComPort.open();
  }
});

module.exports = function (onSerialPortOpen) {
  ComPort.onSerialPort('open', function () {
    Logger.info('ComPort opened, calling listener ...');

    ComEmitter.masterRead();
    onSerialPortOpen();
  });

  ComPort.open();

  setTimeout(function () {
    ComEmitter.startRun();
  }, 1_000);

  CoreEvent.register(CoreEventEnum.EVENT_EXIT, function () {
    ComPort.close();
  });
};
