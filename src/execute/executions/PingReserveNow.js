const state = require('../../state');
const ping = require('../../ping');
const uuid = require('../../utils/uuid');

module.exports = async function (parsedSocketData) {
  state.state.plugs.reservationId[parsedSocketData.body.connectorId] = parsedSocketData.body.reservationId;
  state.state.plugs.expiryDate[parsedSocketData.body.connectorId] = parsedSocketData.body.expiryDate;

  await ping.ReserveNow.execute(
    parsedSocketData.messageId,
    parsedSocketData.body.connectorId,
    ping.ReserveNow.StatusEnum.ACCEPTED
  );

  await ping.StatusNotification.execute(
    uuid(),
    parsedSocketData.body.connectorId,
    ping.StatusNotification.StatusEnum.RESERVED,
    ping.StatusNotification.ErrorCodeEnum.NO_ERROR
  );
};
