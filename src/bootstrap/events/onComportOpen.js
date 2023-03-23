const { CoreEvent, CoreEventEnum } = require('../../libraries/CoreEvent');
const { ComPort } = require('../../libraries/ComPort');
const { ComEmitter } = require('../../libraries/ComEmitter');
const {
  Raspberry,
  RebootSoftwareReasonEnum,
} = require('../../libraries/Raspberry');
const { Logger } = require('../../libraries/Logger');

function openComPort() {
  if (ComPort.isOpened()) {
    ComPort.close();
  }

  ComPort.open();

  setTimeout(function () {
    ComEmitter.startRun();
  }, 1_000);
}

let restartComportAttempts = 0;

module.exports = function (rebootReason, onSerialPortOpen) {
  ComPort.onLongIdle(async function () {
    Logger.info('ComPort stuck, no data received long time.');

    if (rebootReason === RebootSoftwareReasonEnum.COMPORT_STUCK) {
      await Raspberry.restartHardware();
      await Raspberry.restartSoftware(RebootSoftwareReasonEnum.COMPORT_STUCK);
    } else {
      if (++restartComportAttempts === 4) {
        Logger.info('Calling hardware and software reset ...');

        // await Raspberry.restartHardware();
        await Raspberry.restartSoftware(RebootSoftwareReasonEnum.COMPORT_STUCK);

        ComPort.close();
      } else {
        Logger.info('Reopening ComPort due to long delay ...');
        openComPort();
      }
    }
  });

  ComPort.onSerialPort('open', function () {
    Logger.info('ComPort opened, calling listener ...');

    ComEmitter.masterRead();
    onSerialPortOpen();
  });

  openComPort();

  CoreEvent.register(CoreEventEnum.EVENT_EXIT, function () {
    ComPort.close();
  });
};
