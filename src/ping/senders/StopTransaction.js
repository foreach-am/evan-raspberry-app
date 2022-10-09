const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_STOP_TRANSACTION;

function sendStopTransaction({ messageId, connectorId, idTag, transactionId }) {
  const commandArgs = {
    transactionId: transactionId,
    idTag: idTag,
    timestamp: new Date().toISOString(),
    meterStop: (state.statistic.plugs.powerKwh[connectorId] || 0) * 1_000,
  };

  WebSocketSender.send({
    sendType: SendTypeEnum.Request,
    commandId: event,
    messageId: messageId,
    commandArgs: commandArgs,
  });
}

function sendStopTransactionHandler(
  messageId,
  connectorId,
  idTag,
  transactionId
) {
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
