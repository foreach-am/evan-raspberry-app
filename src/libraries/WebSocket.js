const url = require('url');
const { client: WebSocketClient } = require('websocket');
const { EventCommandNameEnum } = require('./EventQueue');
const { Logger } = require('./Logger');
const { OfflineCommand } = require('./OfflineCommand');
const { EventQueue } = require('./EventQueue');

const sleep = require('../utils/sleep');
const uuid = require('../utils/uuid');

const client = new WebSocketClient();

/**
 * @type {import('websocket').connection}
 */
let currentConnection = null;
let connected = false;

function getConnection() {
  return currentConnection;
}

function connectionCloseCallback() {
  Logger.warning('WebSocket - closing connection.');

  // if (currentConnection) {
  //   currentConnection.close();
  // }
}

// keep alive checker - every 10 seconds
const pocketsPingPong = [];
setInterval(function () {
  if (!currentConnection) {
    return;
  }

  const checkerId = uuid();
  pocketsPingPong.push(checkerId);

  Logger.info('WebSocket pinging to server:', checkerId);
  currentConnection.ping(checkerId);

  setTimeout(function () {
    const index = pocketsPingPong.findIndex(function (oldId) {
      return oldId === checkerId;
    });

    if (index !== -1) {
      // PONG response not received during 2 seconds
      connectionCloseCallback();
    } else {
      connected = true;
    }
  }, 2_000);
}, 5_000);

const reconnectionMaxAttempts = 10;
const reconnectionDelays = {
  frequently: 1,
  longDelay: 20,
};

let reconnectionAttempts = 0;

function connectWithUri() {
  // client.abort();

  const uri = url.parse(process.env.WEBSOCKET_URL);
  client.connect(uri, ['ocpp1.6']);
}

function reconnect() {
  connectionCloseCallback();

  // client.abort();

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
  connectionCloseCallback();

  reconnect();
});

client.on('connect', async function (socketClientConnection) {
  currentConnection = socketClientConnection;
  connected = true;

  currentConnection.on('error', function (error) {
    Logger.error('WebSocket connection error:', error);
    reconnect();
  });

  currentConnection.on('close', function (code, description) {
    Logger.error(`WebSocket connection closed [${code}]: ${description}`);
    reconnect();
  });

  currentConnection.on('pong', function (binaryPayload) {
    const checkerId = Buffer.from(binaryPayload).toString('utf-8');
    Logger.info('WebSocket pong received:', checkerId);

    const index = pocketsPingPong.findIndex(function (oldId) {
      return oldId === checkerId;
    });

    if (index !== -1) {
      pocketsPingPong.splice(index, 1);
    }
  });

  currentConnection.on('drain', function () {
    Logger.info('WebSocket connection event triggered drain');
  });
  currentConnection.on('pause', function () {
    Logger.info('WebSocket connection event triggered drapausein');
  });
  currentConnection.on('resume', function () {
    Logger.info('WebSocket connection event triggered resume');
  });

  Logger.info('WebSocket connected successfully.');
  await executeOfflineQueue();
});

function onConnect(callback) {
  client.on('connect', callback);
}

function onConnectionFailure(callback) {
  client.on('connectFailed', callback);
}

function register(event, callback) {
  if (!currentConnection) {
    return Logger.warn('WebSocket is not connected to server right now.');
  }

  currentConnection.on(event, callback);
}

function startServer() {
  connectWithUri();
}

function send({ sendType, commandId, messageId, commandArgs }) {
  const commandName = EventCommandNameEnum[commandId];

  if (!currentConnection || !isConnected()) {
    Logger.info(`Skipping ${commandName} - not connected.`);
    if (EventQueue.isOfflineCacheableCommand(commandName)) {
      OfflineCommand.push({
        sendType,
        commandId,
        messageId,
        commandArgs,
      });

      Logger.info(`Command ${commandName} inserted to offline queue.`);
    }
  }

  sendDataToServer({
    sendType,
    commandId,
    messageId,
    commandArgs,
  });
}

function sendDataToServer({ sendType, commandId, messageId, commandArgs }) {
  const commandName = EventCommandNameEnum[commandId];

  const dataToSend =
    sendType === SendTypeEnum.Request
      ? [sendType, messageId, commandName, commandArgs]
      : [sendType, messageId, commandArgs];

  const dataToSenJson = JSON.stringify(dataToSend);
  Logger.json(`Calling ${commandName} with arguments:`, commandArgs);

  currentConnection.sendUTF(dataToSenJson);
}

async function executeOfflineQueue() {
  while (true) {
    const offlineCommand = await OfflineCommand.shift();
    if (!offlineCommand) {
      await sleep(20);
      return;
    }

    Logger.json('Executing offline command:', offlineCommand);
    await sendDataToServer(offlineCommand);
  }
}

function isConnected() {
  return !!currentConnection && connected;
  // return connected;
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
    isConnected: isConnected,
  },
  WebSocketSender: {
    send: send,
  },
};
