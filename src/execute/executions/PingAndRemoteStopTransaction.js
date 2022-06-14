const { Logger } = require('../../libraries/Logger');
const { Emitter } = require('../../libraries/ComPort');

const state = require('../../state');
const ping = require('../../ping');

module.exports = async function (parsedSocketData) {
  const stopConnectorId = Object.keys(state.state.plugs.transactionId).find(function (itemConnectorId) {
    return state.state.plugs.transactionId[itemConnectorId] === parsedSocketData.body.transactionId;
  });

  if (!stopConnectorId) {
    Logger.warning(`There is no any transaction fund with server provided id: ${stopConnectorId}`);
    return;
  }

  await ping.RemoteStopTransaction.execute(
    parsedSocketData.messageId,
    parsedSocketData.body.connectorId,
    ping.RemoteStopTransaction.StatusEnum.ACCEPTED
  );

  Emitter.plugStop(stopConnectorId);
};
