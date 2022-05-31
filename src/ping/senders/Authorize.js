const { EventQueue, EventQueueEnum } = require('../../libs/EventQueue');
const { WebSocketSender } = require('../../libs/WebSocket');

const commandName = 'Authorize';
const event = EventQueueEnum.EVENT_AUTHORIZE;

function sendAuthorize(data, transactionId) {
  WebSocketSender.send(transactionId, commandName, {
    idTag: 'B4A63CDF',
  });
}

function sendAuthorizeHandler(data, args) {
  return EventQueue.register(event, data, function () {
    sendAuthorize(data, args.transactionId);
  });
}

module.exports = sendAuthorizeHandler;
