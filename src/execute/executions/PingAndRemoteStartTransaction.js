const { ComEmitter } = require('../../libraries/ComEmitter');

const state = require('../../state');
const ping = require('../../ping');

module.exports = async function (parsedServerData) {
  state.state.plugs.idTags[parsedServerData.body.connectorId] = parsedServerData.body.idTag;
  // state.state.plugs.transactionId[parsedServerData.body.connectorId] =
  //   parsedServerData.body.chargingProfile.transactionId;

  await ping.RemoteStartTransaction.execute(
    parsedServerData.messageId,
    parsedServerData.body.connectorId,
    ping.RemoteStartTransaction.StatusEnum.ACCEPTED
  );

  await ping.StatusNotification.execute(
    parsedServerData.body.connectorId,
    ping.StatusNotification.StatusEnum.PREPARING,
    ping.StatusNotification.ErrorCodeEnum.NO_ERROR
  );

  // await ping.StartTransaction.execute(uuid(), parsedServerData.body.connectorId);

  // await ping.StatusNotification.execute(
  //   parsedServerData.body.connectorId,
  //   ping.StatusNotification.StatusEnum.CHARGING,
  //   ping.StatusNotification.ErrorCodeEnum.NO_ERROR
  // );

  ComEmitter.proxire(parsedServerData.body.connectorId);
};
