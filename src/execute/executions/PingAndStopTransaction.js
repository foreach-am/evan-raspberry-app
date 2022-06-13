const { ComPort } = require('../../libraries/ComPort');

const state = require('../../state');
const ping = require('../../ping');

module.exports = async function (parsedSocketData) {
  const stopConnectorId = Object.keys(state.state.plugs.transactionId).find(function (itemConnectorId) {
    return state.state.plugs.transactionId[itemConnectorId] === parsedSocketData.body.transactionId;
  });

  if (stopConnectorId) {
    await ping.RemoteStopTransaction.execute(
      parsedSocketData.messageId,
      parsedSocketData.body.connectorId,
      parsedSocketData.body.transactionId
    );

    ComPort.emit(`PLUG${stopConnectorId}STOP:`);
  }
};
