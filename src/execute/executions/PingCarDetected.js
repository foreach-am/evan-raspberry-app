const state = require('../../state');
const ping = require('../../ping');
const uuid = require('../../utils/uuid');

module.exports = async function (parsedServerData, connectorId) {
  await ping.StatusNotification.execute(
    uuid(),
    connectorId,
    ping.StatusNotification.StatusEnum.PREPARING,
    ping.StatusNotification.ErrorCodeEnum.NO_ERROR
  );

  // await ping.Authorize.execute(uuid(), connectorId, state.state.plugs.idTags[connectorId]);
  await ping.Authorize.execute(uuid(), connectorId, 'UNKNOWN');
};
