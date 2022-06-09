const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_RESERVATION;

function sendReservation({ connectorId, status }) {
  WebSocketSender.send(SendTypeEnum.Response, event, {
    status: status,
  });
}

function sendReservationHandler(connectorId, status) {
  const data = {
    connectorId: connectorId,
    status: status,
  };

  return EventQueue.register(event, connectorId, data, sendReservation);
}

const StatusEnum = {
  Accepted: 'Accepted',
  // @TODO: more statuses from json scheme
};

module.exports = {
  execute: sendReservationHandler,
  enums: {
    StatusEnum: StatusEnum,
  },
};
