const { ComEmitter } = require('../../libraries/ComEmitter');

const state = require('../../state');
const ping = require('../../ping');

module.exports = async function (parsedServerData) {
  // when idTag is invalid
  if (
    !parsedServerData.body // ||
    // typeof parsedServerData.body.idTag !== 'string' ||
    // !parsedServerData.body.idTag ||
    // parsedServerData.body.idTag.toLowerCase() === 'unknown'
  ) {
    await ping.RemoteStartTransaction.execute(
      parsedServerData.messageId,
      parsedServerData.body.connectorId,
      ping.RemoteStartTransaction.StatusEnum.REJECTED
    );
    return;
  }

  // // when transactionId is invalid
  // if (
  //   !parsedServerData.body.transactionId &&
  //   !parsedServerData.body.chargingProfile &&
  //   !parsedServerData.body.chargingProfile.transactionId
  // ) {
  //   await ping.RemoteStartTransaction.execute(
  //     parsedServerData.messageId,
  //     parsedServerData.body.connectorId,
  //     ping.RemoteStartTransaction.StatusEnum.REJECTED
  //   );
  //   return;
  // }

  state.state.plugs.idTags[parsedServerData.body.connectorId] =
    parsedServerData.body.idTag || 'UNKNOWN';

  if (
    parsedServerData.body.chargingProfile &&
    parsedServerData.body.chargingProfile.transactionId
  ) {
    state.state.plugs.transactionId[parsedServerData.body.connectorId] =
      parsedServerData.body.chargingProfile.transactionId;
  }

  if (parsedServerData.body.transactionId) {
    state.state.plugs.transactionId[parsedServerData.body.connectorId] =
      parsedServerData.body.transactionId;
  }

  await ping.RemoteStartTransaction.execute(
    parsedServerData.messageId,
    parsedServerData.body.connectorId,
    ping.RemoteStartTransaction.StatusEnum.ACCEPTED
  );

  ComEmitter.proxire(parsedServerData.body.connectorId);
};
