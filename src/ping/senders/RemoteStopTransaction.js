const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_REMOTE_STOP_TRANSACTION;

function sendRemoteStopTransaction({ messageId, connectorId, transactionId }) {
  WebSocketSender.send(SendTypeEnum.Response, event, messageId, {
    transactionId: transactionId,
  });
}

function sendRemoteStopTransactionHandler(messageId, connectorId, transactionId) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
    transactionId: transactionId,
  };

  return EventQueue.register({
    commandId: event,
    connectorId: connectorId,
    messageId: messageId,
    packetData: data,
    callback: sendRemoteStopTransaction,
  });
}

module.exports = {
  execute: sendRemoteStopTransactionHandler,
};
