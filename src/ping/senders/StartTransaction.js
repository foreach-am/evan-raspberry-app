const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_TRANSACTION_START;

function sendStartTransaction({ connectorId, idTag }) {
  WebSocketSender.send(SendTypeEnum.Request, event, {
    connectorId: connectorId,
    idTag: idTag,
    timestamp: new Date().toISOString(),
    meterStart: 0, // connector power KW/h
    reservationId: state.state.plugs.reservationId[connectorId],
  });
}

function sendStartTransactionHandler(connectorId, idTag) {
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
