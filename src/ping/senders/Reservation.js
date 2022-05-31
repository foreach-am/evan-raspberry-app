const { EventQueue, EventQueueEnum } = require('../../libs/EventQueue');
const { WebSocketSender } = require('../../libs/WebSocket');

const commandName = 'ReserveNow';
const event = EventQueueEnum.EVENT_RESERVE_ACCEPT;

function sendReservation(data, transactionId) {
  WebSocketSender.send(transactionId, commandName, {
    status: 'Accepted',
  });
}

function sendReservationHandler(data, args) {
  return EventQueue.register(event, data, function () {
    sendReservation(data, args.transactionId);
  });
}

module.exports = sendReservationHandler;
