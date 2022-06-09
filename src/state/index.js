const state = {
  // constants
  maxPlugsCount: 1, // @TODO: must be loaded from board.

  // switch flags
  switch: {
    common: {},
    plugs: {
      sendStatusNotification: {},
      sendAuth: {},
      startTransaction: {},
      stopTransaction: {},
      chargeStart: {},
      chargingPeriodAuth: {},
      softLock: {},
    },
  },

  // global state
  state: {
    common: {
      bootNotStatus: '',
      bootNotCurrentTime: '',
      bootNotRequireTime: 1000,
      reservationId: '',
      expiryDateConnector1: '',
      expiryDateConnector2: '',
      receiveServerId: '',
    },
    plugs: {
      idTagInfoStatus: {},
      transactionId: {},
      startTransactionStatus: {},
      stopTransactionStatus: {},
    },
  },

  // statistic
  statistic: {
    common: {
      temperature: 0,
      highVoltError: 0,
      lowVoltError: 0,
      highVoltageMeasure: 0,
      counter: 0,
    },
    plugs: {
      plugState: {},
      powerKwh: {},
      overCurrentError: {},
      counter: {},
      pilotFeedBack: {},
      currentMeasureA: {},
      currentMeasureB: {},
      currentMeasureC: {},
    },
  },
};

for (let i = 1; i <= state.maxPlugsCount; ++i) {
  Object.keys(state.switch.plugs).forEach(function (key) {
    state.switch.plugs[key][i] = true;
  });

  Object.keys(state.state.plugs).forEach(function (key) {
    state.state.plugs[key][i] = '';
  });

  Object.keys(state.statistic.plugs).forEach(function (key) {
    state.statistic.plugs[key][i] = 0;
  });
}

module.exports = state;
