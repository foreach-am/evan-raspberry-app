/* eslint-disable no-unused-vars */

const { ComEmitter } = require('../../libraries/ComEmitter');
const { Raspberry } = require('../../libraries/Raspberry');
const { WebSocket } = require('../../libraries/WebSocket');
const { PlugStateEnum } = require('../../libraries/PlugState');
const state = require('../../state');

module.exports = async function (parsedServerData) {
  // no action required

  Raspberry.mapOnPlugs(async function (connectorId) {
    if (
      // connected to internet
      WebSocket.isConnected() &&

      // soft-lock state
      state.statistic.plugs.plugState[connectorId] ===
        PlugStateEnum.PLUG_SOFT_LOCK

      // // locked due internet lose, or initial state
      // && (state.state.plugs.softLockDueConnectionLose[connectorId] ||
      //   typeof state.state.plugs.softLockDueConnectionLose[connectorId] !==
      //     'boolean')
    ) {
      await ComEmitter.plugOn(connectorId);
    }
  });
};
