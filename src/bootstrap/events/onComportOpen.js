const { CoreEvent, CoreEventEnum } = require('../../libraries/CoreEvent');
const { ComPort } = require('../../libraries/ComPort');
const { ComEmitter } = require('../../libraries/ComEmitter');
const { Raspberry } = require('../../libraries/Raspberry');
const { Logger } = require('../../libraries/Logger');

module.exports = function (onSerialPortOpen) {
  ComPort.onLongIdle(async function () {
    Logger.info('ComPort stuck, calling hardware and software reset ...');

    await Raspberry.restartHardware();
    await Raspberry.restartSoftware();
    await ComPort.close();
  });

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
