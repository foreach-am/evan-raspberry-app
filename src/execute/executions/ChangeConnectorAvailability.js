const state = require('../../state');
const ping = require('../../ping');
const uuid = require('../../utils/uuid');

module.exports = async function (parsedSocketData) {
  const receivedMessageId = parsedSocketData.messageId;

  if (parsedSocketData.body.connectorId > state.maxPlugsCount) {
    await ping.ChangeAvailability.execute(
      receivedMessageId,
      connectorId,
      ping.ChangeAvailability.StatusEnum.REJECTED
    );

    return;
  }

  const possibleStates = Object.values(ping.ChangeAvailability.PointStateEnum);
  if (!possibleStates.includes(parsedSocketData.body.type)) {
    await ping.ChangeAvailability.execute(
      receivedMessageId,
      connectorId,
      ping.ChangeAvailability.StatusEnum.REJECTED
    );

    return;
  }

  await ping.ChangeAvailability.execute(
    receivedMessageId,
    connectorId,
    ping.ChangeAvailability.StatusEnum.SCHEDULED
  );

  if (parsedSocketData.body.type === ping.ChangeAvailability.PointStateEnum.INOPERATIVE) {
    ComPort.emit(`PLUG${parsedSocketData.body.connectorId}OFF:`);

    await ping.StatusNotification.execute(
      uuid(),
      connectorId,
      ping.StatusNotification.StatusEnum.UNAVAILABLE,
      ping.StatusNotification.ErrorCodeEnum.NO_ERROR
    );
  } else if (parsedSocketData.body.type === ping.ChangeAvailability.PointStateEnum.OPERATIVE) {
    ComPort.emit(`PLUG${parsedSocketData.body.connectorId}ONN:`);

    await ping.StatusNotification.execute(
      uuid(),
      connectorId,
      ping.StatusNotification.StatusEnum.AVAILABLE,
      ping.StatusNotification.ErrorCodeEnum.NO_ERROR
    );
  }
};
