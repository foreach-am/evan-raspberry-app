const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_AUTHORIZE;

function sendAuthorize({ idTag, messageId }) {
  WebSocketSender.send(SendTypeEnum.Request, event, messageId, {
    idTag: idTag,
  });
}

function sendAuthorizeHandler(messageId, connectorId, idTag) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
    idTag: idTag,
  };

  return EventQueue.register(event, connectorId, messageId, data, sendAuthorize);
}

module.exports = {
  execute: sendAuthorizeHandler,
};
