const { ComEmitter } = require('../../libraries/ComEmitter');

const state = require('../../state');
const ping = require('../../ping');
const uuid = require('../../utils/uuid');

module.exports = async function (parsedServerData) {
  if (parsedServerData.body.connectorId > state.maxPlugsCount) {
    await ping.ChangeAvailability.execute(
      parsedServerData.messageId,
      parsedServerData.body.connectorId,
      ping.ChangeAvailability.StatusEnum.REJECTED
    );

    return;
  }

  const possibleStates = Object.values(ping.ChangeAvailability.PointStateEnum);
  if (!possibleStates.includes(parsedServerData.body.type)) {
    await ping.ChangeAvailability.execute(
      parsedServerData.messageId,
      parsedServerData.body.connectorId,
      ping.ChangeAvailability.StatusEnum.REJECTED
    );

    return;
  }

  await ping.ChangeAvailability.execute(
    parsedServerData.messageId,
    parsedServerData.body.connectorId,
    ping.ChangeAvailability.StatusEnum.SCHEDULED
  );

  if (
    parsedServerData.body.type ===
    ping.ChangeAvailability.PointStateEnum.INOPERATIVE
  ) {
    ComEmitter.plugOff(parsedServerData.body.connectorId);

    await ping.StatusNotification.execute(
      uuid(),
      parsedServerData.body.connectorId,
      ping.StatusNotification.StatusEnum.UNAVAILABLE,
      ping.StatusNotification.ErrorCodeEnum.NO_ERROR
    );
  } else if (
    parsedServerData.body.type ===
    ping.ChangeAvailability.PointStateEnum.OPERATIVE
  ) {
    ComEmitter.plugOn(parsedServerData.body.connectorId);

    await ping.StatusNotification.execute(
      uuid(),
      parsedServerData.body.connectorId,
      ping.StatusNotification.StatusEnum.AVAILABLE,
      ping.StatusNotification.ErrorCodeEnum.NO_ERROR
    );
  }
};
