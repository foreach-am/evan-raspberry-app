const url = require('url');
const { client: WebSocketClient } = require('websocket');
const { Logger } = require('./Logger');

const client = new WebSocketClient();
let connection = null;

const reconnectionMaxAttempts = 10;
const reconnectionDelays = {
  frequently: 1,
  longDelay: 20,
};

let reconnectionAttempts = 0;

function connectWithUri() {
  const uri = url.parse(process.env.WEBSOCKET_URL);
  client.connect(uri, ['ocpp1.6']);
}

function reconnect() {
  setTimeout(function () {
    if (++reconnectionAttempts < reconnectionMaxAttempts) {
      connectWithUri();
    } else {
      Logger.info(
        `${reconnectionAttempts} times tried to reconnect to WebSocket server.`
      );
      Logger.info(
        `now delaying ${reconnectionDelays.longDelay} seconds before re-try.`
      );

      reconnectionAttempts = 0;

      setTimeout(function () {
        reconnect();
      }, reconnectionDelays.longDelay * 1000);
    }
  }, reconnectionDelays.frequently * 1000);
}

client.on('connectFailed', function (error) {
  Logger.error('Could not connect to server:', error);
  reconnect();
});

function onConnect(callback) {
  client.on('connect', function (currentConnection) {
    connection = currentConnection;

    Logger.error('WebSocket connected successfully.');
  });

  client.on('connect', callback);
}

function onConnectionFailure(callback) {
  client.on('connectFailed', callback);
}

function register(event, callback) {
  if (!connection) {
    return Logger.warn('WebSocket is not connected right now.');
  }

  connection.on('error', function (error) {
    Logger.info('WebSocket connection error:', error);
  });

  connection.on('close', function () {
    Logger.info('WebSocket connection closed.');

    if (code !== 1000) {
      reconnect();
    }
  });

  connection.on(event, callback);
}

function startServer() {
  connectWithUri();
}

function send(transactionId, commandName, commandArgs) {
  Logger.info(
    ` Calling ${commandName}`,
    args.connection.connected,
    args.transactionId
  );

  if (!connection.connected) {
    return Logger.info(
      `Skipping ${commandName}`,
      connection.connected,
      transactionId
    );
  }

  const dataToSend = JSON.stringify([
    2,
    process.env.STATION_TOKEN,
    commandName,
    commandArgs,
  ]);

  connection.sendUTF(dataToSend);
}

module.exports = {
  WebSocket: {
    onConnect: onConnect,
    onConnectionFailure: onConnectionFailure,
    register: register,
    startServer: startServer,
  },
  WebSocketSender: {
    send: send,
  },
};
