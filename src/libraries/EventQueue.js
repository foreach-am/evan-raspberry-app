const { Logger } = require('./Logger');

const EventCommandEnum = {
  EVENT_BOOT_NOTIFICATION: 1,
  EVENT_HEARTH_BEAT: 2,
  EVENT_AUTHORIZE: 3,
  EVENT_TRANSACTION_START: 4,
  EVENT_TRANSACTION_STOP: 5,
  EVENT_RESERVATION: 6,
  EVENT_CHANGE_AVAILABILITY: 7,
  EVENT_STATUS_NOTIFICATION: 8,
  EVENT_REMOTE_START_TRANSACTION: 9,
  EVENT_REMOTE_STOP_TRANSACTION: 10,
};

const EventCommandNameEnum = {
  [EventCommandEnum.EVENT_BOOT_NOTIFICATION]: 'BootNotification',
  [EventCommandEnum.EVENT_HEARTH_BEAT]: 'Heartbeat',
  [EventCommandEnum.EVENT_AUTHORIZE]: 'Authorize',
  [EventCommandEnum.EVENT_TRANSACTION_START]: 'StartTransaction',
  [EventCommandEnum.EVENT_TRANSACTION_STOP]: 'StopTransaction',
  [EventCommandEnum.EVENT_RESERVATION]: 'ReserveNow',
  [EventCommandEnum.EVENT_CHANGE_AVAILABILITY]: 'ChangeAvailability',
  [EventCommandEnum.EVENT_STATUS_NOTIFICATION]: 'StatusNotification',
  [EventCommandEnum.EVENT_REMOTE_START_TRANSACTION]: 'RemoteStartTransaction',
  [EventCommandEnum.EVENT_REMOTE_STOP_TRANSACTION]: 'RemoteStopTransaction',
};

const serverCommandList = [
  EventCommandNameEnum[EventCommandEnum.EVENT_RESERVATION],
  EventCommandNameEnum[EventCommandEnum.EVENT_CHANGE_AVAILABILITY],
  EventCommandNameEnum[EventCommandEnum.EVENT_REMOTE_START_TRANSACTION],
  EventCommandNameEnum[EventCommandEnum.EVENT_REMOTE_STOP_TRANSACTION],
];

let queue = [];

function register(commandId, connectorId, messageId, packetData, callback) {
  const commandName = EventCommandNameEnum[commandId];

  Logger.info(
    `Register ${commandName}`
    // args.transactionId
  );

  queue.push({
    commandId: commandId,
    connectorId: connectorId,
    messageId: messageId,
    packetData: packetData,
    callback: callback,
    status: 'queue',
  });

  return process();
}

// function getPreviousIds() {
//   const foundQueueItem = queue.find(function (queueItem) {
//     return queueItem.status == 'finished';
//   });

//   if (!foundQueueItem) {
//     return null;
//   }

//   return {
//     commandId: foundQueueItem.commandId,
//     connectorId: foundQueueItem.connectorId,
//     messageId: foundQueueItem.messageId,
//   };
// }

// function cleanup() {
//   queue = queue.filter(function (queueItem) {
//     return queueItem.status != 'finished';
//   });
// }

function getByMessageId(messageId) {
  const queueItem = queue.find(function (queue) {
    return queue.messageId == messageId;
  });

  if (!queueItem) {
    return null;
  }

  return {
    commandId: queueItem.commandId,
    connectorId: queueItem.connectorId,
  };
}

function makeFinished(messageId) {
  const queueItemIndex = queue.findIndex(function (queueItem) {
    if (!queueItem) {
      return false;
    }

    return queueItem.messageId == messageId;
  });

  if (queueItemIndex === -1) {
    return;
  }

  // queue[queueItemIndex].status = 'finished';
  queue[queueItemIndex] = undefined;
}

function process() {
  if (queue.length == 0) {
    return Promise.resolve();
  }

  const queueItem = queue.find(function (queue) {
    return queue.status != 'finished';
  });

  if (!queueItem) {
    return Promise.resolve();
  }

  if (queueItem.status == 'running') {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(process());
      }, 100);
    });
  }

  queueItem.status = 'running';

  const onFinish = function (resolve) {
    queueItem.status = 'finished';
    resolve();
  };

  return new Promise(function (resolve) {
    const result = queueItem.callback(queueItem.packetData);
    if (result instanceof Promise) {
      result.finally(function () {
        onFinish(resolve);
      });
    } else {
      onFinish(resolve);
    }
  });
}

function print() {
  Logger.info(
    'EventQueue list:',
    queue.map(function (i) {
      return {
        cmdId: i.commandId,
        status: i.status,
      };
    })
  );
}

function isServerCommand(command) {
  if (typeof command !== 'string') {
    return false;
  }

  return serverCommandList.includes(command);
}

// setInterval(function () {
//   print();
// }, 200);

module.exports = {
  EventCommandEnum: EventCommandEnum,
  EventCommandNameEnum: EventCommandNameEnum,
  EventQueue: {
    register: register,
    // getPreviousIds: getPreviousIds,
    // cleanup: cleanup,
    getByMessageId: getByMessageId,
    makeFinished: makeFinished,
    process: process,
    print: print,
    isServerCommand: isServerCommand,
  },
};
