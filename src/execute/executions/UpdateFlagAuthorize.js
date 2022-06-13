const state = require('../../state');

module.exports = async function (parsedSocketData, connectorId) {
  state.state.plugs.idTagInfoStatus[connectorId] =
    (parsedSocketData.body.idTagInfo || {}).status || 'Accepted';

  state.switch.plugs.chargingPeriodAuth[connectorId] = true;
};
