const execute = require('../../execute');
const Raspberry = require('../../libraries/Raspberry');
const { PlugStateEnum } = require('../../libraries/PlugState');
const { state } = require('../../state');

let meterValueInterval = null;

module.exports = function (seconds) {
  clearInterval(meterValueInterval);

  const interval = seconds * 1_000;

  meterValueInterval = setInterval(() => {
    Raspberry.mapOnPlugs(async function (connectorId) {
      if (
        state.statistic.plugs.plugState[connectorId] !== PlugStateEnum.CHARGING
      ) {
        return;
      }

      await execute.NotifyMeterValues({}, connectorId);
    });
  }, interval);
};
