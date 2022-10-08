const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const uuid = require('../../utils/uuid');

const state = require('../../state');

const event = EventCommandEnum.EVENT_HEARTBEAT;

function sendHeartBeat({ messageId }) {
  const commandArgs = {};

  WebSocketSender.send({
    sendType: SendTypeEnum.Request,
    commandId: event,
    messageId: messageId,
    commandArgs: commandArgs,
  });

  setTimeout(function () {
    sendHeartBeatHandler(uuid());
  }, state.state.common.bootNotRequireTime * 1_000);
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
