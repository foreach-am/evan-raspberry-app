const { EventQueue, EventQueueEnum } = require('../../libs/EventQueue');
const { WebSocketSender } = require('../../libs/WebSocket');

const commandName = 'StartTransaction';
const event = EventQueueEnum.EVENT_TRANSACTION_START;

function sendStartTransaction(data, transactionId) {
  WebSocketSender.send(transactionId, commandName, {
    connectorId: 1,
    idTag: 'B4A63CDF',
    timestamp: new Date().toISOString(),
    meterStart: 0, //data.pow1Kwh,
    reservationId: 1,
  });
}

function sendStartTransactionHandler(data) {
  return EventQueue.register(event, data, function () {
    sendStartTransaction(data, args.connection, args.transactionId);
  });
}

module.exports = sendStartTransactionHandler;
