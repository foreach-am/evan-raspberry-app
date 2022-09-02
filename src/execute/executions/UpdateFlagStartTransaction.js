const state = require('../../state');

module.exports = async function (parsedServerData, connectorId) {
  if (!parsedServerData.body.transactionId) {
    ComEmitter.plugStop(connectorId);
    return;
  }

  state.state.plugs.transactionId[connectorId] = parsedServerData.body.transactionId;

  state.state.plugs.startTransactionStatus[connectorId] =
    (parsedServerData.body.idTagInfo || {}).status || 'Accepted';
};
