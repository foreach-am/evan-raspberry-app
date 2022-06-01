const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_TRANSACTION_START;

function sendStartTransaction(data) {
  WebSocketSender.send(event, {
    connectorId: 1,
    idTag: 'B4A63CDF',
    timestamp: new Date().toISOString(),
    meterStart: 0, //data.pow1Kwh,
    reservationId: 1,
  });
}

function sendStartTransactionHandler(data) {
  return EventQueue.register(event, data, function () {
    sendStartTransaction(data);
  });
}

module.exports = sendStartTransactionHandler;
