const { ComPort } = require('../../libraries/ComPort');

const state = require('../../state');
const ping = require('../../ping');
const uuid = require('../../utils/uuid');

module.exports = async function (parsedSocketData) {
  state.state.plugs.idTags[parsedSocketData.body.connectorId] = parsedSocketData.body.idTag;
  // state.state.plugs.transactionId[parsedSocketData.body.connectorId] =
  //   parsedSocketData.body.chargingProfile.transactionId;

  await ping.RemoteStartTransaction.execute(
    parsedSocketData.messageId,
    parsedSocketData.body.connectorId,
    ping.RemoteStartTransaction.StatusEnum.ACCEPTED
  );

  await ping.StartTransaction.execute(uuid(), parsedSocketData.body.connectorId);

  await ping.StatusNotification.execute(
    parsedSocketData.body.connectorId,
    ping.StatusNotification.StatusEnum.CHARGING,
    ping.StatusNotification.ErrorCodeEnum.NO_ERROR
  );

  ComPort.emit(`PROXIRE${parsedSocketData.body.connectorId}:`);
};
