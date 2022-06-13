const state = require('../../state');

module.exports = async function (parsedSocketData, connectorId) {
  state.state.plugs.transactionId[connectorId] = parsedSocketData.body.transactionId;

  state.state.plugs.startTransactionStatus[connectorId] =
    (parsedSocketData.body.idTagInfo || {}).status || 'Accepted';
};
