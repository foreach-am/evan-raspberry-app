const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_REMOTE_TRANSACTION_STOP;

function sendRemoteStopTransaction({ connectorId, transactionId }) {
  WebSocketSender.send(event, {
    transactionId: transactionId,
  });
}

function sendRemoteStopTransactionHandler(connectorId, transactionId) {
  const data = {
    connectorId: connectorId,
    transactionId: transactionId,
  };

  return EventQueue.register(event, connectorId, data, sendRemoteStopTransaction);
}

module.exports = {
  execute: sendRemoteStopTransactionHandler,
  enums: {},
};
