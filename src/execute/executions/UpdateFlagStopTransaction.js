const state = require('../../state');

module.exports = async function (parsedSocketData, connectorId) {
  state.state.plugs.stopTransactionStatus[connectorId] =
    (parsedSocketData.body.idTagInfo || {}).status || 'Accepted';
};
