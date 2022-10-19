const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_AUTHORIZE;

function sendAuthorize({ idTag, messageId }) {
  const commandArgs = {
    idTag: idTag,
  };

  WebSocketSender.send({
    sendType: SendTypeEnum.Request,
    commandId: event,
    messageId: messageId,
    commandArgs: commandArgs,
  });
}

function sendAuthorizeHandler(messageId, connectorId, idTag) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
    idTag: idTag,
  };

  return EventQueue.register({
    commandId: event,
    connectorId: connectorId,
    messageId: messageId,
    packetData: data,
    callback: sendAuthorize,
  });
}

module.exports = {
  execute: sendAuthorizeHandler,
};
