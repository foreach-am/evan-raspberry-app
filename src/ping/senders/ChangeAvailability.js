const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_CHANGE_AVAILABILITY;

function sendChangeAvailability(data) {
  WebSocketSender.send(event, {
    idTag: 'B4A63CDF',
  });
}

function sendChangeAvailabilityHandler(data) {
  return EventQueue.register(event, data, function () {
    sendChangeAvailability(data);
  });
}

module.exports = sendChangeAvailabilityHandler;
