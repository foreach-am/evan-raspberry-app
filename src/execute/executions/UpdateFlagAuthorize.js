const state = require('../../state');

module.exports = async function (parsedServerData, connectorId) {
  state.state.plugs.idTagInfoStatus[connectorId] =
    (parsedServerData.body.idTagInfo || {}).status || 'Accepted';

  state.switch.plugs.chargingPeriodAuth[connectorId] = true;
};
