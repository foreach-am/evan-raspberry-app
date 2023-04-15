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
ComPort.register(function () {
  restartComportAttempts = 0;
});

module.exports = function (rebootReason, onSerialPortOpen) {
  ComPort.onLongIdle(async function () {
    Logger.info('ComPort stuck, no data received long time.');

    if (rebootReason === RebootSoftwareReasonEnum.COMPORT_STUCK) {
      // await Raspberry.restartHardware();
      await Raspberry.restartSoftware(RebootSoftwareReasonEnum.COMPORT_STUCK);
    } else {
      if (++restartComportAttempts === 2) {
        Logger.info('Calling hardware and software reset ...');
        ComPort.close();

        // await Raspberry.restartHardware();
        await Raspberry.restartSoftware(RebootSoftwareReasonEnum.COMPORT_STUCK);
      } else {
        Logger.info('Reopening ComPort due to long delay ...');
        openComPort();
      }
    }
  });

  const onSerialPortOpenOrResume = function (eventName) {
    Logger.info(`ComPort opened, calling listener [${eventName}] ...`);

    ComEmitter.masterRead();
    onSerialPortOpen();
  };

  ComPort.onSerialPort('open', function () {
    onSerialPortOpenOrResume('open');
  });
  ComPort.onSerialPort('resume', function () {
    onSerialPortOpenOrResume('resume');
  });

  openComPort();

  CoreEvent.register(CoreEventEnum.EVENT_EXIT, function () {
    ComPort.close();
  });
};
