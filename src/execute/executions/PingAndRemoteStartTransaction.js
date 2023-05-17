const { ComEmitter } = require('../../libraries/ComEmitter');

const state = require('../../state');
const ping = require('../../ping');
const sleep = require('../../utils/sleep');

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
  state.saveState();

  if (
    parsedServerData.body.chargingProfile &&
    parsedServerData.body.chargingProfile.transactionId
  ) {
    state.state.plugs.transactionId[parsedServerData.body.connectorId] =
      parsedServerData.body.chargingProfile.transactionId;
    state.saveState();

    console.log();
    console.log();
    console.log();
    console.log();
    console.log('>>>> PingAndRemoteStartTransaction.js (1)');
    console.log('>>>> Last transaction ID');
    console.log('>>>> ' + state.state.plugs.transactionId[connectorId]);
    console.log();
    console.log();
    console.log();
    console.log();
  }

  if (parsedServerData.body.transactionId) {
    state.state.plugs.transactionId[parsedServerData.body.connectorId] =
      parsedServerData.body.transactionId;
    state.saveState();

    console.log();
    console.log();
    console.log();
    console.log();
    console.log('>>>> PingAndRemoteStartTransaction.js (2)');
    console.log('>>>> Last transaction ID');
    console.log('>>>> ' + state.state.plugs.transactionId[connectorId]);
    console.log();
    console.log();
    console.log();
    console.log();
  }

  await ping.RemoteStartTransaction.execute(
    parsedServerData.messageId,
    parsedServerData.body.connectorId,
    ping.RemoteStartTransaction.StatusEnum.ACCEPTED
  );

  await sleep(200);
  ComEmitter.proxire(parsedServerData.body.connectorId);
};
