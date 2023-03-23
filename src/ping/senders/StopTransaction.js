const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_STOP_TRANSACTION;

function sendStopTransaction({
  messageId,
  connectorId,
  idTag,
  transactionId,
  reason,
  timestamp,
}) {
  const commandArgs = {
    transactionId: transactionId,
    idTag: idTag,
    timestamp: timestamp,
    meterStop: (state.statistic.plugs.powerKwh[connectorId] || 0) * 1_000,
    reason: reason,
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
  transactionId,
  reason,
  timestamp = null
) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
    idTag: idTag,
    transactionId: transactionId,
    reason: reason,
    timestamp: timestamp || new Date().toISOString(),
  };

  return EventQueue.register({
    commandId: event,
    connectorId: connectorId,
    messageId: messageId,
    packetData: data,
    callback: sendStopTransaction,
  });
}

const ReasonEnum = {
  EmergencyStop: 'EmergencyStop',
  EVDisconnected: 'EVDisconnected',
  HardReset: 'HardReset',
  Local: 'Local',
  Other: 'Other',
  PowerLoss: 'PowerLoss',
  Reboot: 'Reboot',
  Remote: 'Remote',
  SoftReset: 'SoftReset',
  UnlockCommand: 'UnlockCommand',
  DeAuthorized: 'DeAuthorized',
};

module.exports = {
  execute: sendStopTransactionHandler,
  ReasonEnum: ReasonEnum,
};
