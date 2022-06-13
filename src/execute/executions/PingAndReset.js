const { Raspberry } = require('../../libraries/Raspberry');

module.exports = function (parsedSocketData) {
  let canReset = true;
  for (let connectorId = 1; connectorId <= state.maxPlugsCount; ++connectorId) {
    if (state.statistic.plugs.plugState[itemConnectorId] !== PlugStateEnum.UNPLUGGED) {
      canReset = false;
      break;
    }
  }

  let restartTriggered = false;
  if (canReset) {
    if (parsedSocketData[3].type === ping.Reset.ResetTypeEnum.TYPE_HARDWARE) {
      await ping.Reset.execute(
        parsedSocketData.messageId,
        parsedSocketData.connectorId,
        ping.Reset.ResetStatusEnum.STATUS_ACCEPTED
      );

      restartTriggered = true;
      await Raspberry.restartHardware();
    } else if (parsedSocketData[3].type === ping.Reset.ResetTypeEnum.TYPE_SOFTWARE) {
      await ping.Reset.execute(
        parsedSocketData.messageId,
        parsedSocketData.connectorId,
        ping.Reset.ResetStatusEnum.STATUS_ACCEPTED
      );

      restartTriggered = true;
      await Raspberry.restartSoftware();
    }
  }

  if (!restartTriggered) {
    await ping.Reset.execute(parsedSocketData.messageId, parsedSocketData.connectorId, ping.Reset.ResetStatusEnum.STATUS_REJECTED);
  }
};
