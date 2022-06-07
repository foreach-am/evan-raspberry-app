const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_RESERVATION;

function sendReservation(data) {
  WebSocketSender.send(event, {
    status: 'Accepted',
  });
}

function sendReservationHandler(data) {
  return EventQueue.register(event, data, function () {
    sendReservation(data);
  });
}

module.exports = sendReservationHandler;
