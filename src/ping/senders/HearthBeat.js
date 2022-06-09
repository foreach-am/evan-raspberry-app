const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const state = require('../../state');

const event = EventCommandEnum.EVENT_HEARTH_BEAT;

function sendHeartBeat({}) {
  WebSocketSender.send(SendTypeEnum.Request, event, {});

  setTimeout(function () {
    sendHeartBeatHandler();
  }, state.state.common.bootNotRequireTime * 1000);
}

function sendHeartBeatHandler() {
  const data = {};

  return EventQueue.register(event, null, data, sendHeartBeat);
}

module.exports = {
  execute: sendHeartBeatHandler,
  enums: {},
};
