const { ComEmitter } = require('../../libraries/ComEmitter');

const state = require('../../state');
const ping = require('../../ping');

module.exports = async function (parsedServerData) {
  if (!parsedServerData.body || !parsedServerData.body.idTag) {
    await ping.RemoteStartTransaction.execute(
      parsedServerData.messageId,
      parsedServerData.body.connectorId,
      ping.RemoteStartTransaction.StatusEnum.REJECTED
    );
    return;
  }

  state.state.plugs.idTags[parsedServerData.body.connectorId] = parsedServerData.body.idTag;

  if (parsedServerData.body.chargingProfile && parsedServerData.body.chargingProfile.transactionId) {
    state.state.plugs.transactionId[parsedServerData.body.connectorId] =
      parsedServerData.body.chargingProfile.transactionId;
  }

  if (parsedServerData.body.transactionId) {
    state.state.plugs.transactionId[parsedServerData.body.connectorId] = parsedServerData.body.transactionId;
  }

  await ping.RemoteStartTransaction.execute(
    parsedServerData.messageId,
    parsedServerData.body.connectorId,
    ping.RemoteStartTransaction.StatusEnum.ACCEPTED
  );

  ComEmitter.proxire(parsedServerData.body.connectorId);
};
