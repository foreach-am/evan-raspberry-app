const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_RESERVE_NOW;

function sendReserveNow({ messageId, connectorId, status }) {
  WebSocketSender.send(SendTypeEnum.Response, event, messageId, {
    status: status,
  });
}

function sendReserveNowHandler(messageId, connectorId, status) {
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
    callback: sendReserveNow,
  });
}

const StatusEnum = {
  ACCEPTED: 'Accepted',
  FAULTED: 'Faulted',
  OCCUPIED: 'Occupied',
  REJECTED: 'Rejected',
  UNAVAILABLE: 'Unavailable',
};

module.exports = {
  execute: sendReserveNowHandler,
  StatusEnum: StatusEnum,
};
