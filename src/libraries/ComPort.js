const { SerialPort } = require('serialport');
const { Logger } = require('./Logger');
const { PlugStateEnum } = require('./PlugState');
const state = require('../state');
const uuid = require('../utils/uuid');

const serialPort = new SerialPort({
  baudRate: 9_600,
  path: process.env.SERIAL_PORT_PATH,
  autoOpen: false,
});

let onReadyCallbackIndex = 0;
let onReadyCallbacks = {};

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
});

serialPort.on('close', function () {
  Logger.info('SerialPort connection closed.');
});

let lastComDataReceivedTime = null;
let inputData = '';

serialPort.on('data', function (data) {
  inputData += data;

  const indexStart = inputData.indexOf('*');
  const indexEnd = inputData.indexOf('@');
  if (indexStart === -1 || indexEnd === -1) {
    if (indexStart === -1) {
      inputData = '';
    }

    return;
  }

  lastComDataReceivedTime = Date.now();

  inputData = inputData.substring(indexStart, indexEnd + 1);
  Logger.info('SerialPort data received:', inputData);

  parseInputData(inputData);
  inputData = '';

  try {
    Object.keys(onReadyCallbacks).forEach(function (callIndex) {
      const callback = onReadyCallbacks[callIndex];
      if (typeof callback === 'function') {
        try {
          callback();
        } catch (e) {
          Logger.error(e);
        }
      }
    });
  } catch (e) {
    Logger.error(e);
  }
});

function getSegmentValue(segment) {
  if (!segment || !segment.includes('=')) {
    return {};
  }

  const [segmentKey, segmentValue] = segment.split('=');
  const matchResult = segmentKey.match(/^([A-Z]+)([0-9]*)$/);
  if (!matchResult) {
    return {};
  }

  const name = matchResult[1];
  const connectorId = matchResult[2];

  return {
    connectorId: connectorId,
    name: name,
    value: segmentValue,
  };
}

function parseInputData(text) {
  const startChar = '*';
  const endChar = '@';

  const startCharIndex = text.indexOf(startChar);
  const endCharIndex = text.indexOf(endChar);

  const packet = text.substring(
    startCharIndex + startChar.length,
    endCharIndex
  );

  const setters = {
    plug: {
      PI: { field: 'pilotFeedBack', isNumeric: true },
      PL: {
        field: 'plugState',
        isNumeric: true,
        validValues: [
          PlugStateEnum.UNPLUGGED,
          PlugStateEnum.CAR_DETECTED,
          PlugStateEnum.CHARGING,
          PlugStateEnum.NO_POWER_ABORT,
          PlugStateEnum.CAR_ERROR_12V_ERROR,
          PlugStateEnum.PLUG_SOFT_LOCK,
          PlugStateEnum.OVER_CURRENT_ERROR,
          PlugStateEnum.PLUG_RESERVE,
          PlugStateEnum.CHARGE_COMPLETED,
        ],
      },
      PW: { field: 'powerKwh', isNumeric: true },
      CA: { field: 'currentMeasureA', isNumeric: true },
      CB: { field: 'currentMeasureB', isNumeric: true },
      CC: { field: 'currentMeasureC', isNumeric: true },
      OCE: { field: 'overCurrentError', isNumeric: true },
      BL: { field: 'batteryLevel', isNumeric: true },
    },
    common: {
      HV: { field: 'highVoltageMeasure', isNumeric: true },
      HVE: { field: 'highVoltError', isNumeric: true },
      LV: { field: 'lowVoltError', isNumeric: true },
      T: { field: 'temperature', isNumeric: true },
    },
  };

  let isValidPacket = true;
  const dataToSet = {
    plugs: {},
    common: {},
  };

  const parseAndSetValue = function (
    { value, connectorId },
    { field, isNumeric, validValues }
  ) {
    if (isValidPacket) {
      const parsedValue = isNumeric ? Number(value) : value;
      if (Array.isArray(validValues) && !validValues.includes(parsedValue)) {
        isValidPacket = false;
      } else {
        if (connectorId) {
          dataToSet.plugs[field] = dataToSet.plugs[field] || {};
          dataToSet.plugs[field][connectorId] = parsedValue;
        } else {
          dataToSet.common[field] = parsedValue;
        }
      }
    }
  };

  packet
    .split(':')
    .filter(function (part) {
      return !!part;
    })
    .forEach(function (part) {
      const { connectorId, name, value } = getSegmentValue(part);

      if (Object.keys(setters.plug).includes(name)) {
        parseAndSetValue({ value, connectorId }, setters.plug[name]);
      } else if (Object.keys(setters.common).includes(name)) {
        parseAndSetValue({ value }, setters.common[name]);
      }
    });

  if (isValidPacket) {
    for (const field in dataToSet.plugs) {
      for (const connectorId in dataToSet.plugs[field]) {
        state.statistic.plugs[field][connectorId] =
          dataToSet.plugs[field][connectorId];
      }
    }
    for (const field in dataToSet.common) {
      state.statistic.common[field] = dataToSet.common[field];
    }
  }
}

function emitMessage(message) {
  return new Promise(function (resolve, reject) {
    const prefix = `SerialPort message [message -> ${uuid()}]`;
    Logger.info(`${prefix} - emitting`);

    serialPort.write(message, function (error, ...result) {
      if (error) {
        Logger.info(`${prefix} - error:`, error);
        return reject(error);
      }

      Logger.info(`${prefix} - success`);
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

function onceSerialPort(event, callback) {
  Logger.info('SerialPort event registered ONCE:', event);
  serialPort.once(event, callback);
}

function openSerialPort() {
  Logger.info('SerialPort opening called.');
  serialPort.open();
}

function closeSerialPort() {
  Logger.info('SerialPort closing called.');
  serialPort.close();
}

function isSerialPortOpen() {
  return serialPort.isOpen;
}

const onIdleCallbacks = [];
function onLongIdle(callback) {
  onIdleCallbacks.push(callback);
}

let onIdleInterval = null;
function startIdleChecker() {
  clearTimeout(onIdleInterval);
  lastComDataReceivedTime = null;

  onIdleInterval = setInterval(async function () {
    if (!lastComDataReceivedTime) {
      lastComDataReceivedTime = Date.now();
      return;
    }

    const currentDateTime = Date.now();
    const timesElapsed = currentDateTime - lastComDataReceivedTime;
    if (timesElapsed > 12_000) {
      Logger.warning(
        `ComPort: ${timesElapsed} milliseconds elapsed, calling OnLongIdleEvent listeners.`
      );

      clearInterval(onIdleInterval);
      for (const callback of onIdleCallbacks) {
        await callback();
      }
    }
  }, 2_000);
}

module.exports = {
  ComPort: {
    onLongIdle: onLongIdle,
    startIdleChecker: startIdleChecker,
    emit: emitMessage,
    register: registerCallback,
    unregister: unregisterCallback,
    onSerialPort: onSerialPort,
    onceSerialPort: onceSerialPort,
    open: openSerialPort,
    close: closeSerialPort,
    isOpened: isSerialPortOpen,
  },
};
