const state = require('../../state');
const ping = require('../../ping');
const uuid = require('../../utils/uuid');

module.exports = async function (parsedServerData) {
  state.state.plugs.reservationId[parsedServerData.body.connectorId] = parsedServerData.body.reservationId;
  state.state.plugs.expiryDate[parsedServerData.body.connectorId] = parsedServerData.body.expiryDate;

  await ping.ReserveNow.execute(
    parsedServerData.messageId,
    parsedServerData.body.connectorId,
    ping.ReserveNow.StatusEnum.ACCEPTED
  );

  await ping.StatusNotification.execute(
    uuid(),
    parsedServerData.body.connectorId,
    ping.StatusNotification.StatusEnum.RESERVED,
    ping.StatusNotification.ErrorCodeEnum.NO_ERROR
  );
};
