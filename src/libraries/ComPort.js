const { SerialPort } = require('serialport');
const { Logger } = require('./Logger');
const state = require('../state');

const serialPort = new SerialPort({
  baudRate: 9600,
  path: process.env.SERIAL_PORT_PATH,
  autoOpen: false,
});

let onReadyCallbackIndex = 0;
let onReadyCallbacks = {};

let intervalRunning = false;

serialPort.on('pause', function () {
  Logger.info('SerialPort event handled:', 'pause');
});

serialPort.on('resume', function () {
  Logger.info('SerialPort event handled:', 'resume');
});

serialPort.on('error', function (error) {
  Logger.error('SerialPort error handled:', error);
});

serialPort.on('open', function () {
  Logger.info('SerialPort connected successfully.');
  intervalRunning = true;
});

serialPort.on('close', function () {
  Logger.info('SerialPort connection closed.');
  intervalRunning = false;
});

let lastDataTime = null;
let inputData = '';

serialPort.on('data', function (data) {
  lastDataTime = Date.now();

  if (!intervalRunning) {
    return;
  }

  inputData += data;

  const indexStart = inputData.indexOf('*');
  const indexEnd = inputData.indexOf('@');
  if (-1 === indexStart || -1 === indexEnd) {
    return;
  }

  inputData = inputData.substring(indexStart, indexEnd + 1);
  Logger.info('SerialPort data received:', inputData);

  parseInputData(inputData);
  inputData = '';

  Object.keys(onReadyCallbacks).forEach(function (callIndex) {
    const callback = onReadyCallbacks[callIndex];
    if (typeof callback === 'function') {
      callback();
    }
  });
});

function getSegmentValue(segment) {
  const [segmentKey, segmentValue] = segment.split('=');

  const matchResult = segmentKey.match(/^([A-Z]+)([0-9]*)$/);
  if (!matchResult) {
    return null;
  }

  const name = matchResult[1];
  const index = matchResult[2];

  return {
    index: index,
    name: name,
    value: segmentValue,
  };
}

function parseInputData(text) {
  const startChar = '*';
  const endChar = '@';

  const startCharIndex = text.indexOf(startChar);
  const endCharIndex = text.indexOf(endChar);

  const packet = text.substring(startCharIndex + startChar.length, endCharIndex);

  packet
    .split(':')
    .filter(function (part) {
      return !!part;
    })
    .forEach(function (part) {
      const { index, name, value } = getSegmentValue(part);

      switch (name) {
        // plugs
        case 'PI':
          state.statistic.plugs.pilotFeedBack[index] = Number(value) / 100;
          break;
        case 'PL':
          state.statistic.plugs.plugState[index] = Number(value);
          break;
        case 'PW':
          state.statistic.plugs.powerKwh[index] = Number(value) / 100;
          break;
        case 'CA':
          state.statistic.plugs.currentMeasureA[index] = Number(value) / 100;
          break;
        case 'CB':
          state.statistic.plugs.currentMeasureB[index] = Number(value) / 100;
          break;
        case 'CC':
          state.statistic.plugs.currentMeasureC[index] = Number(value) / 100;
          break;
        case 'OCE':
          state.statistic.plugs.overCurrentError[index] = Number(value);
          break;

        // common
        case 'HV':
          state.statistic.common.highVoltageMeasure = Number(value) / 100;
          break;
        case 'HVE':
          state.statistic.common.highVoltError = Number(value);
          break;
        case 'LV':
          state.statistic.common.lowVoltError = Number(value);
          break;
        case 'T':
          state.statistic.common.temperature = Number(value) / 100;
          break;
      }
    });
}

function emitMessage(message, callback) {
  return new Promise(function (resolve, reject) {
    Logger.info('Emitting SerialPort message:', message);

    serialPort.write(message, function (error, ...result) {
      if (error) {
        return reject(error);
      }

      return resolve(...result);
    });
  });
}

function registerCallback(callback) {
  onReadyCallbacks[++onReadyCallbackIndex] = callback;
  return onReadyCallbackIndex;
}

function unregisterCallback(index) {
  if (typeof onReadyCallbacks[index] === 'function') {
    delete onReadyCallbacks[index];
  }
}

function onSerialPort(event, callback) {
  Logger.info('SerialPort event registered:', event);
  serialPort.on(event, callback);
}

function openSerialPort() {
  Logger.info('SerialPort opening called.');
  serialPort.open();
}

function closeSerialPort() {
  Logger.info('SerialPort closing called.');
  serialPort.close();
}

const onIdleCallbacks = [];
function onLongIdle(callback) {
  onIdleCallbacks.push(callback);
}

function startIdleChecker() {
  const intervalComPortIdle = setInterval(async function () {
    if (!lastDataTime) {
      lastDataTime = Date.now();
    }

    const currentDateTime = Date.now();
    if (currentDateTime - lastDataTime > 7000) {
      clearInterval(intervalComPortIdle);

      for (const callback of onIdleCallbacks) {
        await callback();
      }
    }
  }, 2000);
}

module.exports = {
  ComPort: {
    onLongIdle: onLongIdle,
    startIdleChecker: startIdleChecker,
    emit: emitMessage,
    register: registerCallback,
    unregister: unregisterCallback,
    onSerialPort: onSerialPort,
    open: openSerialPort,
    close: closeSerialPort,
  },
};
