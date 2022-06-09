const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_TRANSACTION_STOP;

function sendStopTransaction({ connectorId, idTag }) {
  const connectorId = 1;

  WebSocketSender.send(event, {
    transactionId: state.state.plugs.transactionId[connectorId],
    idTag: idTag,
    timestamp: new Date().toISOString(),
    meterStop: 0, // connector power KW/h
  });
}

function sendStopTransactionHandler(connectorId, idTag = 'B4A63CDF') {
  const data = {
    connectorId: connectorId,
    idTag: idTag,
  };

  return EventQueue.register(event, data, sendStopTransaction);
}

module.exports = {
  execute: sendStopTransactionHandler,
  enums: {},
};
