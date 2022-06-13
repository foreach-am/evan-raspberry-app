const state = require('../../state');
const ping = require('../../ping');
const uuid = require('../../utils/uuid');

module.exports = function (parsedSocketData) {
  const receivedMessageId = parsedSocketData[1];
  const serverAskedConnectorId = parsedSocketData[3].connectorId;

  state.state.plugs.reservationId[serverAskedConnectorId] = parsedSocketData[3].reservationId;
  state.state.plugs.expiryDate[serverAskedConnectorId] = parsedSocketData[3].expiryDate;

  await ping.ReserveNow.execute(receivedMessageId, serverAskedConnectorId, ping.ReserveNow.StatusEnum.ACCEPTED);

  await ping.StatusNotification.execute(
    uuid(),
    serverAskedConnectorId,
    ping.StatusNotification.StatusEnum.RESERVED,
    ping.StatusNotification.ErrorCodeEnum.NO_ERROR
  );
};
