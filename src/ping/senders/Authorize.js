const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_AUTHORIZE;

function sendAuthorize(data) {
  WebSocketSender.send(event, {
    idTag: 'B4A63CDF',
  });
}

function sendAuthorizeHandler(data) {
  return EventQueue.register(event, data, function () {
    sendAuthorize(data);
  });
}

module.exports = sendAuthorizeHandler;
