const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_START_TRANSACTION;

function sendStartTransaction({ messageId, connectorId, idTag }) {
  const commandArgs = {
    connectorId: connectorId,
    idTag: idTag,
    timestamp: new Date().toISOString(),
    meterStart: (state.statistic.plugs.powerKwh[connectorId] || 0) * 1_000,
  };

  if (state.state.plugs.reservationId[connectorId]) {
    commandArgs.reservationId = state.state.plugs.reservationId[connectorId];
  }

  WebSocketSender.send({
    sendType: SendTypeEnum.Request,
    commandId: event,
    messageId: messageId,
    commandArgs: commandArgs,
  });
}

function sendStartTransactionHandler(messageId, connectorId, idTag) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
    idTag: idTag,
  };

  return EventQueue.register({
    commandId: event,
    connectorId: connectorId,
    messageId: messageId,
    packetData: data,
    callback: sendStartTransaction,
  });
}

module.exports = {
  execute: sendStartTransactionHandler,
};
