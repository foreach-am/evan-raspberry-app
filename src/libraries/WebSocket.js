const { WebSocket: WebSocketClient } = require('ws');
const { EventCommandNameEnum } = require('./EventQueue');
const { Logger } = require('./Logger');
const { OfflineCommand } = require('./OfflineCommand');
const { EventQueue } = require('./EventQueue');

const sleep = require('../utils/sleep');
const uuid = require('../utils/uuid');

let connected = false;
let client = null;

connectWithUri();

const reconnectionMaxAttempts = 10;
const reconnectionDelays = {
  frequently: 1,
  longDelay: 20,
};
let reconnectionAttempts = 0;

const clientEvents = {};

/**
 * @type {import('ws')}
 */
let currentConnection = null;
function getConnection() {
  return currentConnection;
}

function connectWithUri() {
  if (client) {
    // client.close();
    // ....
  }

  client = new WebSocketClient(process.env.WEBSOCKET_URL, ['ocpp1.6']);

  client.on('error', function (error) {
    Logger.error('Could not connect to server:', error);
    connectionCloseCallback();
  });

  client.on('unexpected-response', function (error) {
    Logger.error('Could not connect to server:', error);
    connectionCloseCallback();
  });

  client.on('open', async function () {
    currentConnection = client;
    connected = true;

    currentConnection.on('error', function (error) {
      Logger.error('WebSocket connection error:', error);
      reconnect();
    });

    currentConnection.on('unexpected-response', function (error) {
      Logger.error('Could not connect to server:', error);
      connectionCloseCallback();
    });

    currentConnection.on('close', function (code, description) {
      Logger.error(`WebSocket connection closed [${code}]: ${description}`);
      connectionCloseCallback();
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
      Logger.info('WebSocket connection event triggered pause');
    });
    currentConnection.on('resume', function () {
      Logger.info('WebSocket connection event triggered resume');
    });

    Logger.info('WebSocket connected successfully.');
    await executeOfflineQueue();
  });
}

function connectionCloseCallback(tryReconnect = true) {
  if (connected) {
    Logger.warning('WebSocket - closing connection.');
    connected = false;

    // if (currentConnection) {
    //   currentConnection.close();
    // }
  }

  if (tryReconnect) {
    setTimeout(function () {
      reconnect();
    }, reconnectionDelays.longDelay * 1_000);
  }
}

// keep alive checker - every 10 seconds
const pocketsPingPong = [];
setInterval(function () {
  if (!currentConnection) {
    return;
  }

  const checkerId = uuid();
  pocketsPingPong.push(checkerId);

  Logger.info('WebSocket ping to server:', checkerId);
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

function reconnect() {
  Logger.info('Reconnecting to server ...');
  connectionCloseCallback(false);

  // client.close();

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
      }, reconnectionDelays.longDelay * 1_000);
    }
  }, reconnectionDelays.frequently * 1_000);
}

function onConnect(callback) {
  clientEvents['open'] = clientEvents['open'] || [];
  clientEvents['open'].push(callback);

  client.on('open', callback);
}

function onConnectionFailure(callback) {
  client.on('error', callback);
  client.on('unexpected-response', callback);
}

function register(event, callback) {
  clientEvents[event] = clientEvents[event] || [];
  clientEvents[event].push(callback);

  if (!currentConnection) {
    return Logger.warn('WebSocket is not connected to server right now.');
  }

  if (event === 'message') {
    currentConnection.on(event, function (buffer) {
      const messageResult = buffer.toString('utf8');
      const message = {
        type: 'buffer',
        utf8Data: null,
        buffer: buffer,
      };

      if (typeof messageResult === 'string') {
        message.type = 'utf8';
        message.utf8Data = messageResult;
      }

      callback(message);
    });
  } else {
    currentConnection.on(event, callback);
  }
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

  return sendDataToServer({
    sendType,
    commandId,
    messageId,
    commandArgs,
  });
}

function sendDataToServer({ sendType, commandId, messageId, commandArgs }) {
  if (!currentConnection) {
    return false;
  }

  const commandName = EventCommandNameEnum[commandId];

  const dataToSend =
    sendType === SendTypeEnum.Request
      ? [sendType, messageId, commandName, commandArgs]
      : [sendType, messageId, commandArgs];

  const dataToSenJson = JSON.stringify(dataToSend);
  Logger.json(
    `Calling ${commandName} [${messageId}] with arguments:`,
    commandArgs
  );

  try {
    currentConnection.send(dataToSenJson, { binary: false });
    return true;
  } catch (e) {
    return false;
  }
}

async function executeOfflineQueue() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const offlineCommand = await OfflineCommand.first();
    if (!offlineCommand) {
      return;
    }

    Logger.json('Executing offline command:', offlineCommand);
    const dataSent = sendDataToServer(offlineCommand);

    if (dataSent) {
      await OfflineCommand.shift();
    } else {
      Logger.error('Failed to execute offline command, trying in next step.');
    }

    await sleep(50);
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
