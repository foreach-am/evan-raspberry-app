const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_CHANGE_AVAILABILITY;

function sendChangeAvailability({ status }) {
  WebSocketSender.send(event, {
    status: status,
  });
}

function sendChangeAvailabilityHandler(connectorId, status) {
  const data = {
    connectorId: connectorId,
    status: status,
  };

  return EventQueue.register(event, connectorId, data, sendChangeAvailability);
}

const StatusEnum = {
  Rejected: 'Rejected',
  Scheduled: 'Scheduled',
  Accepted: 'Accepted',
};

module.exports = {
  execute: sendChangeAvailabilityHandler,
  enums: {
    StatusEnum: StatusEnum,
  },
};
