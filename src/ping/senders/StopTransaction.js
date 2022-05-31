const { EventQueue, EventQueueEnum } = require('../../libs/EventQueue');
const { Logger } = require('../../libs/Logger');

const commandName = 'StopTransaction';
const event = EventQueueEnum.EVENT_TRANSACTION_STOP;

function sendStopTransaction(data, transactionId) {
  WebSocketSender.send(transactionId, commandName, {
    transactionId: transactionId,
    idTag: 'B4A63CDF',
    timestamp: new Date().toISOString(),
    meterStop: 0, //data.pow1Kwh
  });
}

function sendStopTransactionHandler(data) {
  return EventQueue.register(event, data, function () {
    sendStopTransaction(data, args.connection, args.transactionId);
  });
}

module.exports = sendStopTransactionHandler;
