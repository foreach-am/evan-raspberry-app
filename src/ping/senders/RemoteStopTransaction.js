const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_REMOTE_STOP_TRANSACTION;

function sendRemoteStopTransaction({ messageId, connectorId, transactionId }) {
  WebSocketSender.send(SendTypeEnum.Response, event, {
    transactionId: transactionId,
  });
}

function sendRemoteStopTransactionHandler(messageId, connectorId, transactionId) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
    transactionId: transactionId,
  };

  return EventQueue.register(event, connectorId, messageId, data, sendRemoteStopTransaction);
}

module.exports = {
  execute: sendRemoteStopTransactionHandler,
};
