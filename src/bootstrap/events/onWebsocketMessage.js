const { WebSocket } = require('../../libraries/WebSocket');
const { LastTime } = require('../../libraries/OfflineManager');
const ping = require('../../ping');
const uuid = require('../../utils/uuid');
const state = require('../../state');
const execute = require('../../execute');
const { ComEmitter } = require('../../libraries/ComEmitter');
const { PlugStateEnum } = require('../../libraries/PlugState');

const initialState = (() => {
  try {
    state.loadSavedState();
    return {
      transaction: JSON.parse(JSON.stringify(state.state.plugs.transactionId)),
      plugState: JSON.parse(JSON.stringify(state.statistic.plugs.plugState)),
    };
  } catch (e) {
    return {};
  }
})();

async function closePreviousTransactionsInCaseOfPowerReset() {
  const lastTimeSaved = LastTime.getLastTime();
  if (!lastTimeSaved) {
    return;
  }

  for (const connectorId in state.state.plugs.transactionId) {
    if (
      initialState.transaction[connectorId] === state.state.plugs.transactionId[connectorId]
    ) {
      if (
        initialState.transaction[connectorId] &&
        parseInt(initialState.transaction[connectorId]) > 0 &&
        initialState.plugState[connectorId] === PlugStateEnum.CHARGING
      ) {
        await ComEmitter.proxire(connectorId);
      }

      continue;
    }

    state.state.plugs.previousPlugState[connectorId] =
      state.statistic.plugs.plugState[connectorId];

    await ComEmitter.plugStop(connectorId);

    await execute.UpdateFlagStopTransaction(
      {},
      connectorId,
      ping.StopTransaction.ReasonEnum.Reboot
    );
  }
}

function registerLastTimeInterval() {
  LastTime.register(2);
}

async function sendBootNotification() {
  await ping.BootNotification.execute(uuid());
}

module.exports = function (onWsMessage) {
  WebSocket.register('close', function () {
    ping.Heartbeat.cleanup();
  });

  // eslint-disable-next-line no-unused-vars
  WebSocket.onConnect(async function (connection) {
    WebSocket.register('message', onWsMessage);

    await closePreviousTransactionsInCaseOfPowerReset();
    await sendBootNotification();
    await registerLastTimeInterval();
  });
};
