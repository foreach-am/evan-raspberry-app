const ComEmitter = require('../../libraries/ComEmitter');
const state = require('../../state');

module.exports = async function (parsedServerData, connectorId) {
  if (!parsedServerData.body.transactionId) {
    ComEmitter.plugStop(connectorId);
    return;
  }

  state.state.plugs.transactionId[connectorId] =
    parsedServerData.body.transactionId;
  state.saveState();

  console.log();
  console.log();
  console.log();
  console.log();
  console.log('>>>> UpdateFlagStartTransaction.js');
  console.log('>>>> Last transaction ID');
  console.log('>>>> ' + state.state.plugs.transactionId[connectorId]);
  console.log(parsedServerData);
  console.log();
  console.log();
  console.log();

  state.state.plugs.startTransactionStatus[connectorId] =
    (parsedServerData.body.idTagInfo || {}).status || 'Accepted';
};
