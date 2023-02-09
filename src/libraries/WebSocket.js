const dns = require('dns');
const { WebSocket: WebSocketClient } = require('ws');
const { EventCommandNameEnum } = require('./EventQueue');
const { Logger } = require('./Logger');
const { OfflineCommand } = require('./OfflineCommand');
const { EventQueue } = require('./EventQueue');

const sleep = require('../utils/sleep');
const uuid = require('../utils/uuid');

const clientEvents = {
  connection: {},
  instance: {},
};
let client = null;
let connected = false;

connectWithUri(false);

const reconnectionMaxAttempts = 10;
const reconnectionDelays = {
  frequently: 1,
  longDelay: 20,
};
let reconnectionAttempts = 0;

/**
 * @type {import('ws')}
 */
let currentConnection = null;
function getConnection() {
  return currentConnection;
}

async function isConnectedToInternet() {
  const checkSingle = function (host) {
    return new Promise(function (resolve) {
      dns.lookup(host, function (error) {
        resolve(!error);
      });
    });
  };

  const checkHosts = [
    'google.com',
    'www.google.com',
    'amazon.com',
    'www.amazon.com',
    '8.8.8.8',
  ];
  for (const host of checkHosts) {
    const success = await checkSingle(host);
    if (success) {
      return true;
    }
  }

  return false;
}

async function connectWithUri(triggerPreviousEvents) {
  // const internetConnected = await isConnectedToInternet();
  // if (!internetConnected) {
  //   Logger.warning('The charger was not connected to the internet.');
  //   return;
  // }

  // if (client) {
  //   client.close();
  //   // ...
  // }

  Logger.info('Connecting to WebSocket server ...');
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
    reconnectionAttempts = 0;
    currentConnection = client;
    connected = true;

    currentConnection.on('error', function (error) {
      Logger.error('WebSocket connection error:', error);
      connectionCloseCallback();
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

    if (triggerPreviousEvents) {
      Object.keys(clientEvents.instance).forEach(function (eventName) {
        clientEvents.instance[eventName].forEach(function (listener) {
          if (eventName === 'message') {
            currentConnection.on(eventName, function (buffer) {
              messageParser(buffer, listener);
            });
          } else {
            currentConnection.on(eventName, listener);
          }
        });
      });
    }

    Logger.info('WebSocket connected successfully.');
    await executeOfflineQueue();
  });

  if (triggerPreviousEvents) {
    Object.keys(clientEvents.connection).forEach(function (eventName) {
      clientEvents.connection[eventName].forEach(function (listener) {
        client.on(eventName, listener);
      });
    });
  }
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
  if (
    !currentConnection ||
    currentConnection.readyState !== currentConnection.OPEN
  ) {
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
  if (connected) {
    return;
  }

  Logger.info('Reconnecting to server ...');

  setTimeout(function () {
    if (++reconnectionAttempts < reconnectionMaxAttempts) {
      connectWithUri(true);
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
  clientEvents.connection['open'] = clientEvents.connection['open'] || [];
  clientEvents.connection['open'].push(callback);

  client.on('open', callback);
}

function messageParser(buffer, callback) {
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
}

function register(eventName, callback) {
  clientEvents.instance[eventName] = clientEvents.instance[eventName] || [];
  clientEvents.instance[eventName].push(callback);

  if (!currentConnection) {
    return Logger.warn('WebSocket is not connected to server right now.');
  }

  if (eventName === 'message') {
    currentConnection.on(eventName, function (buffer) {
      messageParser(buffer, callback);
    });
  } else {
    currentConnection.on(eventName, callback);
  }
}

function startServer() {
  // connectWithUri(false);
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
    const offlineCommand = OfflineCommand.first();
    if (!offlineCommand) {
      return;
    }

    Logger.json('Executing offline command:', offlineCommand);
    const dataSent = sendDataToServer(offlineCommand);

    if (!dataSent) {
      Logger.error('Failed to execute offline command, trying in next step.');
      OfflineCommand.push(offlineCommand);
    }

    await sleep(10);
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
    register: register,
    startServer: startServer,
    isConnected: isConnected,
  },
  WebSocketSender: {
    send: send,
  },
};
