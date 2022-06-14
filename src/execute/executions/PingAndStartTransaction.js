const uuid = require('../../utils/uuid');
const state = require('../../state');
const ping = require('../../ping');

module.exports = async function (connectorId) {
  await ping.StatusNotification.execute(
    connectorId,
    ping.StatusNotification.StatusEnum.CHARGING,
    ping.StatusNotification.ErrorCodeEnum.NO_ERROR
  );

  await ping.StartTransaction.execute(uuid(), connectorId, state.state.plugs.idTags[connectorId]);
};
