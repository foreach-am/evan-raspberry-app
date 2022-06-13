const url = require('url');
const { client: WebSocketClient } = require('websocket');
const { EventCommandNameEnum } = require('./EventQueue');
const { Logger } = require('./Logger');

const client = new WebSocketClient();

let connection = null;
function getConnection() {
  return connection;
}

const reconnectionMaxAttempts = 10;
const reconnectionDelays = {
  frequently: 1,
  longDelay: 20,
};

let reconnectionAttempts = 0;

function connectWithUri() {
  client.abort();

  const uri = url.parse(process.env.WEBSOCKET_URL);
  client.connect(uri, ['ocpp1.6']);
}

function reconnect() {
  connection = null;
  client.abort();

  setTimeout(function () {
    if (++reconnectionAttempts < reconnectionMaxAttempts) {
      connectWithUri();
    } else {
      Logger.info(`${reconnectionAttempts} times tried to reconnect to WebSocket server.`);
      Logger.info(`now delaying ${reconnectionDelays.longDelay} seconds before re-try.`);

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

    Logger.info('WebSocket connected successfully.');
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
    Logger.error('WebSocket connection error:', error);
    reconnect();
  });

  connection.on('close', function () {
    Logger.error('WebSocket connection closed.');
    reconnect();
  });

  connection.on(event, callback);
}

function startServer() {
  connectWithUri();
}

function send(sendType, commandId, messageId, commandArgs) {
  const commandName = EventCommandNameEnum[commandId];

  if (!connection.connected) {
    return Logger.info(
      `Skipping ${commandName}`
      // transactionId
    );
  }

  const dataToSend = JSON.stringify([sendType, messageId, commandName, commandArgs]);
  Logger.json(` Calling ${commandName} with arguments:`, commandArgs);
  // Logger.json(` Sending ${commandName} with json data:`, dataToSend);

  connection.sendUTF(dataToSend);
}

const SendTypeEnum = {
  Request: 2,
  Response: 3,
  Error: 4,
};

module.exports = {
  SendTypeEnum: SendTypeEnum,
  WebSocket: {
    getConnection: getConnection,
    onConnect: onConnect,
    onConnectionFailure: onConnectionFailure,
    register: register,
    startServer: startServer,
  },
  WebSocketSender: {
    send: send,
  },
};
