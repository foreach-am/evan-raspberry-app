const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_AUTHORIZE;

function sendAuthorize({ idTag }) {
  WebSocketSender.send(SendTypeEnum.Request, event, {
    idTag: idTag,
  });
}

function sendAuthorizeHandler(connectorId, idTag) {
  const data = {
    connectorId: connectorId,
    idTag: idTag,
  };

  return EventQueue.register(event, connectorId, data, sendAuthorize);
}

module.exports = {
  execute: sendAuthorizeHandler,
  enums: {},
};
