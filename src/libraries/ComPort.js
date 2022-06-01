const { SerialPort } = require('serialport');
const { Logger } = require('./Logger');

const serialPort = new SerialPort({
  baudRate: 9600,
  path: process.env.SERIAL_PORT_PATH,
});

let onReadyCallbackIndex = 0;
let onReadyCallbacks = {};

const flagData = {
  pilotFeedBackA: '',
  pilotFeedBackB: '',
  currentMeasureA: '',
  currentMeasureB: '',
  currentMeasureC: '',
  currentMeasureD: '',
  highVoltageMeasure: '',
  plugState1: '',
  plugState2: '',
  highVoltError: '',
  lowVoltError: '',
  pow1Kwh: '',
  pow2Kwh: '',
  overCurrent1Error: '',
  overCurrent2Error: '',
  temperature: '',
  counter: '',
};

let intervalRunning = false;
setInterval(function () {
  if (intervalRunning) {
    emitMessage('MASTERREAD:');
  }
}, 2000);

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
  if (-1 == indexStart || -1 == indexEnd) {
    return;
  }

  inputData = inputData.substring(indexStart, indexEnd + 1);

  InputDataParser(inputData);
  inputData = '';

  Object.keys(onReadyCallbacks).forEach(function (callIndex) {
    const callback = onReadyCallbacks[callIndex];
    if (typeof callback === 'function') {
      callback(flagData);
    }
  });
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

        if (iteration == 1) {
          flagData.pilotFeedBackA = Number(result) / 100;
        } else if (iteration == 2) {
          flagData.pilotFeedBackB = Number(result) / 100;
        } else if (iteration == 3) {
          flagData.currentMeasureA = Number(result) / 100;
        } else if (iteration == 4) {
          flagData.currentMeasureB = Number(result) / 100;
        } else if (iteration == 5) {
          flagData.currentMeasureC = Number(result) / 100;
        } else if (iteration == 6) {
          flagData.currentMeasureD = Number(result) / 100;
        } else if (iteration == 7) {
          flagData.highVoltageMeasure = Number(result) / 100;
        } else if (iteration == 8) {
          flagData.plugState1 = Number(result);
        } else if (iteration == 9) {
          flagData.plugState2 = Number(result);
        } else if (iteration == 10) {
          flagData.highVoltError = Number(result);
        } else if (iteration == 11) {
          flagData.lowVoltError = Number(result);
        } else if (iteration == 12) {
          flagData.pow1Kwh = Number(result) / 100;
        } else if (iteration == 13) {
          flagData.pow2Kwh = Number(result) / 100;
        } else if (iteration == 14) {
          flagData.overCurrent1Error = Number(result);
        } else if (iteration == 15) {
          flagData.overCurrent2Error = Number(result);
        } else if (iteration == 16) {
          //flagData.pilotFeedBackA =  result
        } else if (iteration == 17) {
          //flagData.pilotFeedBackB = result
        } else if (iteration == 18) {
          flagData.temperature = Number(result) / 100;
        } else if (iteration == 19) {
          flagData.counter = Number(result);
        } else if (iteration == 20) {
          //flagData.pilotFeedBackB = result
        }

        break;
      }

      iteration++;
    }
  }

  // Logger.json(flagData);
}

function emitMessage(message, callback) {
  Logger.info('SerialPort emitting message:', message);
  serialPort.write(message, callback);
}

function registerCallback(callback) {
  onReadyCallbacks[++onReadyCallbackIndex] = callback;
  return onReadyCallbackIndex;
}

function unregisterCallback(index) {
  if (typeof onReadyCallbacks[index] == 'function') {
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
