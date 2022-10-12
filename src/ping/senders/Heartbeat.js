const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const uuid = require('../../utils/uuid');

const state = require('../../state');

const event = EventCommandEnum.EVENT_HEARTBEAT;

let timer = null;
function sendHeartBeat({ messageId }) {
  const commandArgs = {};

  WebSocketSender.send({
    sendType: SendTypeEnum.Request,
    commandId: event,
    messageId: messageId,
    commandArgs: commandArgs,
  });

  timer = setTimeout(function () {
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

function cleanup() {
  clearTimeout(timer);
}

module.exports = {
  execute: sendHeartBeatHandler,
  cleanup: cleanup,
};
