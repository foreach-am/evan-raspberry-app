const { Logger } = require('../libraries/Logger');
const state = require('../state');

module.exports = function () {
  const logResult = {};
  const append = function (key, value, char = ' ') {
    logResult[key.padStart(22, char)] = value;
  };

  const { temperature, highVoltError, lowVoltError, highVoltageMeasure } =
    state.statistic.common;

  const {
    pilotFeedBack,
    currentMeasureA,
    currentMeasureB,
    currentMeasureC,
    overCurrentError,
    plugState,
    powerKwh,
  } = state.statistic.plugs;

  append(` DEVICE LOG`, '----------------------------------------', '-');
  append('Device Temperature', `${temperature} C`);
  append('HighVoltError', `${highVoltError} State`);
  append('LowVoltError', `${lowVoltError} State`);
  append('HighVoltageMeasure', `${highVoltageMeasure} V.AC`);

  for (let i = 1; i <= state.maxPlugsCount; ++i) {
    append(` PLUG LOG [${i}]`, '----------------------------------------', '-');
    append(`PlugState[${i}]`, `${plugState[i]} State`);
    append(`PowerKwH[${i}]`, `${powerKwh[i]} KW/h`);
    append(`FeedBackVolt[${i}]`, `${pilotFeedBack[i]} V`);
    append(`CurrentMeasureA[${i}]`, `${currentMeasureA[i]} A`);
    append(`CurrentMeasureB[${i}]`, `${currentMeasureB[i]} A`);
    append(`CurrentMeasureC[${i}]`, `${currentMeasureC[i]} A`);
    append(`OverCurrentError[${i}]`, `${overCurrentError[i]} State`);
  }

  Logger.divider();
  Logger.json('Device measurement data is ready:', logResult);
};
