const { WebSocket } = require('../../libraries/WebSocket');
const ping = require('../../ping');

module.exports = function ({ onConnect, onMessage }) {
  WebSocket.register('close', function () {
    ping.Heartbeat.cleanup();
  });

  // eslint-disable-next-line no-unused-vars
  WebSocket.onConnect(async function (connection) {
    if (typeof onConnect === 'function') {
      await onConnect();
    }

    WebSocket.register('message', onMessage);
  });
};
