const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_TRANSACTION_STOP;

function sendStopTransaction({ connectorId, idTag }) {
  WebSocketSender.send(SendTypeEnum.Request, event, {
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

  return EventQueue.register(event, connectorId, data, sendStopTransaction);
}

module.exports = {
  execute: sendStopTransactionHandler,
  enums: {},
};
