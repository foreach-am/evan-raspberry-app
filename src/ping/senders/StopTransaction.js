const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_STOP_TRANSACTION;

function sendStopTransaction({ messageId, connectorId, idTag, transactionId }) {
  WebSocketSender.send({
    sendType: SendTypeEnum.Request,
    commandId: event,
    messageId: messageId,
    commandArgs: {
      transactionId: transactionId,
      idTag: idTag,
      timestamp: new Date().toISOString(),
      meterStop: 20, // connector power KW/h
    },
  });
}

function sendStopTransactionHandler(messageId, connectorId, idTag, transactionId) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
    idTag: idTag,
    transactionId: transactionId,
  };

  return EventQueue.register({
    commandId: event,
    connectorId: connectorId,
    messageId: messageId,
    packetData: data,
    callback: sendStopTransaction,
  });
}

module.exports = {
  execute: sendStopTransactionHandler,
};
