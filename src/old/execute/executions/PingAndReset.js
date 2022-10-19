const { Raspberry } = require('../../libraries/Raspberry');
const { PlugStateEnum } = require('../../libraries/PlugState');

const state = require('../../state');
const ping = require('../../ping');

module.exports = async function (parsedServerData) {
  let canReset = true;
  await Raspberry.mapOnPlugs(async function (connectorId) {
    if (state.statistic.plugs.plugState[connectorId] !== PlugStateEnum.UNPLUGGED) {
      canReset = false;
    }
  });

  let restartTriggered = false;
  if (canReset) {
    if (parsedServerData.body.type === ping.Reset.ResetTypeEnum.TYPE_HARDWARE) {
      await ping.Reset.execute(
        parsedServerData.messageId,
        parsedServerData.body.connectorId,
        ping.Reset.ResetStatusEnum.STATUS_ACCEPTED
      );

      restartTriggered = true;
      await Raspberry.restartHardware();
    } else if (parsedServerData.body.type === ping.Reset.ResetTypeEnum.TYPE_SOFTWARE) {
      await ping.Reset.execute(
        parsedServerData.messageId,
        parsedServerData.body.connectorId,
        ping.Reset.ResetStatusEnum.STATUS_ACCEPTED
      );

      restartTriggered = true;
      await Raspberry.restartSoftware();
    }
  }

  if (!restartTriggered) {
    await ping.Reset.execute(
      parsedServerData.messageId,
      parsedServerData.body.connectorId,
      ping.Reset.ResetStatusEnum.STATUS_REJECTED
    );
  }
};
