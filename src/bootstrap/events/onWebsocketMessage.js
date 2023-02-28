const { WebSocket } = require('../../libraries/WebSocket');
const { LastTime } = require('../../libraries/OfflineManager');
const ping = require('../../ping');
const uuid = require('../../utils/uuid');
const state = require('../../state');
const execute = require('../../execute');

const initialState = JSON.stringify(
  JSON.parse(state.state.plugs.transactionId)
);

async function closePreviousTransactions() {
  const lastTimeSaved = LastTime.getLastTime();
  if (!lastTimeSaved) {
    return;
  }

  state.loadSavedState();
  for (const connectorId in state.state.plugs.transactionId) {
    if (
      initialState[connectorId] === state.statistic.plugs.plugState[connectorId]
    ) {
      continue;
    }

    state.state.plugs.previousPlugState[connectorId] =
      state.statistic.plugs.plugState[connectorId];

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

    await closePreviousTransactions();
    await sendBootNotification();
    await registerLastTimeInterval();
  });
};
