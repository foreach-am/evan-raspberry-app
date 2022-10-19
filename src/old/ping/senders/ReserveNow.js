const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_RESERVE_NOW;

function sendReserveNow({ messageId, connectorId, status }) {
  const commandArgs = {
    status: status,
  };

  WebSocketSender.send({
    sendType: SendTypeEnum.Response,
    commandId: event,
    messageId: messageId,
    commandArgs: commandArgs,
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
