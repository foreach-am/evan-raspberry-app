const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_TRANSACTION_START;

function sendStartTransaction({ connectorId, idTag }) {
  WebSocketSender.send(event, {
    connectorId: connectorId,
    idTag: idTag,
    timestamp: new Date().toISOString(),
    meterStart: 0, // connector power KW/h
    reservationId: state.state.plugs.reservationId[connectorId],
  });
}

function sendStartTransactionHandler(connectorId, idTag = 'B4A63CDF') {
  const data = {
    connectorId: connectorId,
    idTag: idTag,
  };

  return EventQueue.register(event, connectorId, data, sendStartTransaction);
}

module.exports = {
  execute: sendStartTransactionHandler,
  enums: {},
};
