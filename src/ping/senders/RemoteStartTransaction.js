const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_REMOTE_TRANSACTION_START;

function sendRemoteStartTransaction({ connectorId, status }) {
  WebSocketSender.send(event, {
    connectorId: connectorId,
    status: status,
  });
}

function sendRemoteStartTransactionHandler(connectorId, status) {
  const data = {
    connectorId: connectorId,
    status: status,
  };

  return EventQueue.register(event, connectorId, data, sendRemoteStartTransaction);
}

const StatusEnum = {
  Accepted: 'Accepted',
  Rejected: 'Rejected',
};

module.exports = {
  execute: sendRemoteStartTransactionHandler,
  enums: {
    StatusEnum: StatusEnum,
  },
};
