/* eslint-disable no-unused-vars */

const { ComEmitter } = require('../../libraries/ComEmitter');
const { Raspberry } = require('../../libraries/Raspberry');
const { WebSocket } = require('../../libraries/WebSocket');
const state = require('../../state');

module.exports = async function (parsedServerData) {
  // no action required

  Raspberry.mapOnPlugs(async function (connectorId) {
    if (
      WebSocket.isConnected() &&
      state.statistic.plugs.plugState[connectorId] ===
        PlugStateEnum.PLUG_SOFT_LOCK &&
      state.state.plugs.softLockDueConnectionLose[connectorId]
    ) {
      await ComEmitter.plugOn(connectorId);
    }
  });
};
