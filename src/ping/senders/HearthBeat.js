const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const state = require('../../state');

const event = EventCommandEnum.EVENT_HEARTH_BEAT;

function sendHeartBeat({ messageId }) {
  WebSocketSender.send({
    sendType: SendTypeEnum.Request,
    commandId: event,
    messageId: messageId,
    commandArgs: {},
  });

  setTimeout(function () {
    sendHeartBeatHandler();
  }, state.state.common.bootNotRequireTime * 1000);
}

function sendHeartBeatHandler(messageId) {
  const data = {
    messageId: messageId,
  };

  return EventQueue.register({
    commandId: event,
    connectorId: null,
    messageId: messageId,
    packetData: data,
    callback: sendHeartBeat,
  });
}

module.exports = {
  execute: sendHeartBeatHandler,
};
