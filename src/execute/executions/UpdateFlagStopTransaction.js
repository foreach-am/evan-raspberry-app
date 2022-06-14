const state = require('../../state');

module.exports = async function (parsedServerData, connectorId) {
  state.state.plugs.stopTransactionStatus[connectorId] =
    (parsedServerData.body.idTagInfo || {}).status || 'Accepted';
};
