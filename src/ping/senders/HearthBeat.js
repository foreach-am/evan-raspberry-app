const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const state = require('../../state');

const event = EventCommandEnum.EVENT_HEARTH_BEAT;

function sendHeartBeat({ messageId }) {
  WebSocketSender.send(SendTypeEnum.Request, event, messageId, {});

  setTimeout(function () {
    sendHeartBeatHandler();
  }, state.state.common.bootNotRequireTime * 1000);
}

function sendHeartBeatHandler(messageId) {
  const data = {
    messageId: messageId,
  };

  return EventQueue.register(event, null, messageId, data, sendHeartBeat);
}

module.exports = {
  execute: sendHeartBeatHandler,
};
