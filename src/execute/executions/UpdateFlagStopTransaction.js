const { Logger } = require('../../libraries/Logger');

const state = require('../../state');
const ping = require('../../ping');
const uuid = require('../../utils/uuid');

module.exports = async function (parsedServerData, connectorId) {
  // state.state.plugs.stopTransactionStatus[connectorId] =
  //   (parsedServerData.body.idTagInfo || {}).status || 'Accepted';

  await ping.StopTransaction.execute(
    uuid(),
    connectorId,
    state.state.plugs.idTags[connectorId],
    state.state.plugs.transactionId[connectorId]
  );

  state.state.plugs.transactionId[connectorId] = '';
  state.state.plugs.idTags[connectorId] = '';
  state.state.plugs.idTagInfoStatus[connectorId] = '';

  await ping.StatusNotification.execute(
    uuid(),
    connectorId,
    ping.StatusNotification.StatusEnum.AVAILABLE,
    ping.StatusNotification.ErrorCodeEnum.NO_ERROR
  );

  Logger.info('Charge completed.');
};
