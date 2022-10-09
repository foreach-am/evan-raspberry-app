const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_REMOTE_STOP_TRANSACTION;

// eslint-disable-next-line no-unused-vars
function sendRemoteStopTransaction({ messageId, connectorId, status }) {
  const commandArgs = {
    status: status,
    // connectorId: connectorId,
  };

  WebSocketSender.send({
    sendType: SendTypeEnum.Response,
    commandId: event,
    messageId: messageId,
    commandArgs: commandArgs,
  });
}

function sendRemoteStopTransactionHandler(messageId, connectorId, status) {
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
    callback: sendRemoteStopTransaction,
  });
}

const StatusEnum = {
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};

module.exports = {
  execute: sendRemoteStopTransactionHandler,
  StatusEnum: StatusEnum,
};
