const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_TRANSACTION_START;

function sendStartTransaction({ messageId, connectorId, idTag }) {
  WebSocketSender.send(SendTypeEnum.Request, event, messageId, {
    connectorId: connectorId,
    idTag: idTag,
    timestamp: new Date().toISOString(),
    meterStart: 0, // connector power KW/h
    reservationId: state.state.plugs.reservationId[connectorId],
  });
}

function sendStartTransactionHandler(messageId, connectorId, idTag) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
    idTag: idTag,
  };

  return EventQueue.register(event, connectorId, messageId, data, sendStartTransaction);
}

module.exports = {
  execute: sendStartTransactionHandler,
};
