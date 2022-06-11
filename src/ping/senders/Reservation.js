const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_RESERVATION;

function sendReservation({ messageId, connectorId, status }) {
  WebSocketSender.send(SendTypeEnum.Response, event, messageId, {
    status: status,
  });
}

function sendReservationHandler(messageId, connectorId, status) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
    status: status,
  };

  return EventQueue.register(event, connectorId, messageId, data, sendReservation);
}

const StatusEnum = {
  ACCEPTED: 'Accepted',
  // @TODO: more statuses from json scheme
};

module.exports = {
  execute: sendReservationHandler,
  StatusEnum: StatusEnum,
};
