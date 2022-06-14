const { Logger } = require('../../libraries/Logger');
const { ComEmitter } = require('../../libraries/ComEmitter');

const state = require('../../state');
const ping = require('../../ping');

module.exports = async function (parsedServerData) {
  console.log(
    '---------------------------------------------------------------------------------------------------------'
  );
  console.log(
    '---------------------------------------------------------------------------------------------------------'
  );
  console.log(
    '---------------------------------------------------------------------------------------------------------'
  );
  console.log(
    '---------------------------------------------------------------------------------------------------------'
  );
  console.log(
    '---------------------------------------------------------------------------------------------------------'
  );
  console.log(state.state.plugs.transactionId, parsedServerData.body.transactionId);
  const stopConnectorId = Object.keys(state.state.plugs.transactionId).find(function (itemConnectorId) {
    return state.state.plugs.transactionId[itemConnectorId] === parsedServerData.body.transactionId;
  });

  if (!stopConnectorId) {
    Logger.warning(`There is no any transaction fund with server provided id: ${stopConnectorId}`);
    return;
  }

  await ping.RemoteStopTransaction.execute(
    parsedServerData.messageId,
    parsedServerData.body.connectorId,
    ping.RemoteStopTransaction.StatusEnum.ACCEPTED
  );

  ComEmitter.plugStop(stopConnectorId);
};
