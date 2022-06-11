const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_CHANGE_AVAILABILITY;

function sendChangeAvailability({ messageId, status }) {
  WebSocketSender.send(SendTypeEnum.Response, event, messageId, {
    status: status,
  });
}

function sendChangeAvailabilityHandler(messageId, connectorId, status) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
    status: status,
  };

  return EventQueue.register(event, connectorId, messageId, data, sendChangeAvailability);
}

const PointStateEnum = {
  INOPERATIVE: 'Inoperative',
  OPERATIVE: 'Operative',
};

const StatusEnum = {
  REJECTED: 'Rejected',
  SCHEDULED: 'Scheduled',
  ACCEPTED: 'Accepted',
};

module.exports = {
  execute: sendChangeAvailabilityHandler,
  PointStateEnum: PointStateEnum,
  StatusEnum: StatusEnum,
};
