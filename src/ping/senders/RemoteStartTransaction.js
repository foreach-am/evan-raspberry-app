const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_REMOTE_START_TRANSACTION;

function sendRemoteStartTransaction({ messageId, connectorId, status }) {
  WebSocketSender.send({
    sendType: SendTypeEnum.Response,
    commandId: event,
    messageId: messageId,
    commandArgs: {
      // connectorId: connectorId,
      status: status,
    },
  });
}

function sendRemoteStartTransactionHandler(messageId, connectorId, status) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
    status: status,
  };

  return EventQueue.register({
    commandId: event,
    connectorId: connectorId,
    messageId: messageId,
    packetData: data,
    callback: sendRemoteStartTransaction,
  });
}

const StatusEnum = {
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};

module.exports = {
  execute: sendRemoteStartTransactionHandler,
  StatusEnum: StatusEnum,
};
