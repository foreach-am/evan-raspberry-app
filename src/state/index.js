const { StateKeeper } = require('../libraries/OfflineManager');

const state = {
  // constants
  maxPlugsCount: 2, // @TODO: must be loaded from board.

  // switch flags
  switch: {
    common: {},
    plugs: {
      sendStatusNotification: {},
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
      bootNotRequireTime: 1_000,
      receiveServerId: '',
    },
    plugs: {
      idTagInfoStatus: {},
      idTags: {},
      transactionId: {},
      startTransactionStatus: {},
      stopTransactionStatus: {},
      reservationId: {},
      expiryDate: {},

      previousPlugState: {},
      softLockDueConnectionLose: {},
    },
  },

  // statistic
  statistic: {
    common: {
      temperature: 0,
      highVoltError: 0,
      lowVoltError: 0,
      highVoltageMeasure: 0,
    },
    plugs: {
      plugState: {},
      powerKwh: {},
      overCurrentError: {},
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

function saveCurrentState() {
  StateKeeper.saveState(this.state);
}

function loadCurrentState() {
  StateKeeper.fillSavedState(this.state);
}

state.saveState = saveCurrentState.bind(state);
state.loadSavedState = loadCurrentState.bind(state);

state.loadSavedState();

module.exports = state;
