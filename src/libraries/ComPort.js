const { SerialPort } = require('serialport');
const { Logger } = require('./Logger');
const state = require('../state');

const serialPort = new SerialPort({
  baudRate: 9600,
  path: process.env.SERIAL_PORT_PATH,
});

let onReadyCallbackIndex = 0;
let onReadyCallbacks = {};

let intervalRunning = false;

serialPort.write('STARTRUN:');
serialPort.on('open', function () {
  intervalRunning = true;
  emitMessage('MASTERREAD:');
});

serialPort.on('close', function () {
  intervalRunning = false;
});

let inputData = '';
serialPort.on('data', function (data) {
  inputData += data;

  const indexStart = inputData.indexOf('*');
  const indexEnd = inputData.indexOf('@');
  if (-1 === indexStart || -1 === indexEnd) {
    return;
  }

  inputData = inputData.substring(indexStart, indexEnd + 1);
  // Logger.info('Input data received:', inputData);

  InputDataParser(inputData);
  inputData = '';

  Object.keys(onReadyCallbacks).forEach(function (callIndex) {
    const callback = onReadyCallbacks[callIndex];
    if (typeof callback === 'function') {
      callback();
    }
  });

  if (!intervalRunning) {
    return;
  }

  setTimeout(function () {
    emitMessage('MASTERREAD:');
  }, 2000);
});

serialPort.on('error', function (error) {
  Logger.error('SerialPort error handled:', error);
});

function InputDataParser(text) {
  let iteration = 1;

  for (var i = 0; i < text.length; i++) {
    if (text[i] === ':') {
      const firstIndex = i + 1;

      for (var y = firstIndex; y < text.length; y++) {
        if (text[y] !== ':') {
          continue;
        }

        const lastIndex = y - 1;
        let result = '';

        for (let k = firstIndex; k <= lastIndex; k++) {
          result += text[k];
        }

        if (iteration === 1) {
          state.statistic.plugs.pilotFeedBack[1] = Number(result) / 100;
        } else if (iteration === 2) {
          state.statistic.plugs.pilotFeedBack[2] = Number(result) / 100;
        } else if (iteration === 3) {
          state.statistic.plugs.currentMeasureA[1] = Number(result) / 100;
        } else if (iteration === 4) {
          state.statistic.plugs.currentMeasureA[2] = Number(result) / 100;
        } else if (iteration === 5) {
          state.statistic.plugs.currentMeasureB[2] = Number(result) / 100;
        } else if (iteration === 6) {
          state.statistic.plugs.currentMeasureC[2] = Number(result) / 100;
        } else if (iteration === 7) {
          state.statistic.common.highVoltageMeasure = Number(result) / 100;
        } else if (iteration === 8) {
          state.statistic.plugs.plugState[1] = Number(result);
        } else if (iteration === 9) {
          state.statistic.plugs.plugState[2] = Number(result);
        } else if (iteration === 10) {
          state.statistic.common.highVoltError = Number(result);
        } else if (iteration === 11) {
          state.statistic.common.lowVoltError = Number(result);
        } else if (iteration === 12) {
          state.statistic.plugs.powerKwh[1] = Number(result) / 100;
        } else if (iteration === 13) {
          state.statistic.plugs.powerKwh[2] = Number(result) / 100;
        } else if (iteration === 14) {
          state.statistic.plugs.overCurrentError[1] = Number(result);
        } else if (iteration === 15) {
          state.statistic.plugs.overCurrentError[2] = Number(result);
        } else if (iteration === 16) {
          //state.statistic.plugs.pilotFeedBack[1] =  result
        } else if (iteration === 17) {
          //state.statistic.plugs.pilotFeedBack[2] = result
        } else if (iteration === 18) {
          state.statistic.common.temperature = Number(result) / 100;
        } else if (iteration === 19) {
          state.statistic.common.counter = Number(result);
        } else if (iteration === 20) {
          //state.statistic.plugs.pilotFeedBack[2] = result
        }

        break;
      }

      iteration++;
    }
  }
}

function emitMessage(message, callback) {
  Logger.info('Emitting SerialPort message:', message);
  serialPort.write(message, callback);
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

module.exports = {
  ComPort: {
    emit: emitMessage,
    register: registerCallback,
    unregister: unregisterCallback,
  },
};
