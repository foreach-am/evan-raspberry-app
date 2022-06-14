const state = require('../../state');
const ping = require('../../ping');

module.exports = async function (parsedServerData, connectorId) {
  state.state.plugs.stopTransactionStatus[connectorId] =
    (parsedServerData.body.idTagInfo || {}).status || 'Accepted';

  await ping.StopTransaction.execute(
    uuid(),
    connectorId,
    state.state.plugs.idTags[connectorId],
    state.state.plugs.transactionId[connectorId]
  );
};
