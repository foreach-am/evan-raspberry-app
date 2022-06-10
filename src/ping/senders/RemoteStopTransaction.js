const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_REMOTE_STOP_TRANSACTION;

function sendRemoteStopTransaction({ connectorId, transactionId }) {
  WebSocketSender.send(SendTypeEnum.Response, event, {
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
