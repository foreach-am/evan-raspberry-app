const { WebSocket } = require('../../libraries/WebSocket');
const ping = require('../../ping');

function closePreviousTransactions() {
  // ...
}

function sendBootNotification() {
  ping.BootNotification.execute(uuid());
}

module.exports = function (onWsMessage) {
  WebSocket.register('close', function () {
    ping.Heartbeat.cleanup();
  });

  // eslint-disable-next-line no-unused-vars
  WebSocket.onConnect(async function (connection) {
    WebSocket.register('message', onWsMessage);

    closePreviousTransactions();
    sendBootNotification();
  });
};
