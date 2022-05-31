const { EventQueue, EventQueueEnum } = require('../../libs/EventQueue');
const { WebSocketSender } = require('../../libs/WebSocket');

const commandName = 'Heartbeat';
const event = EventQueueEnum.EVENT_HEARTHBEAT;

function sendHeartBeat(data, transactionId, bootNotRequireTime) {
  WebSocketSender.send(transactionId, commandName, {});

  setTimeout(function () {
    sendHeartBeatHandler(data);
  }, bootNotRequireTime * 1000);
}

function sendHeartBeatHandler(data, args) {
  return EventQueue.register(event, data, function () {
    sendHeartBeat(data, args.transactionId, args.bootNotRequireTime);
  });
}

module.exports = sendHeartBeatHandler;
