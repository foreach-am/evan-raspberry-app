const { Logger } = require('./Logger');

const EventCommandEnum = {
  EVENT_BOOT_NOTIFICATION: 1,
  EVENT_HEARTH_BEAT: 2,
  EVENT_AUTHORIZE: 3,
  EVENT_TRANSACTION_START: 4,
  EVENT_TRANSACTION_STOP: 5,
  EVENT_RESERVATION: 6,
  EVENT_CHANGE_AVAILABILITY: 7,
};

const EventCommandNameEnum = {
  [EventCommandEnum.EVENT_BOOT_NOTIFICATION]: 'BootNotification',
  [EventCommandEnum.EVENT_HEARTH_BEAT]: 'Heartbeat',
  [EventCommandEnum.EVENT_AUTHORIZE]: 'Authorize',
  [EventCommandEnum.EVENT_TRANSACTION_START]: 'StartTransaction',
  [EventCommandEnum.EVENT_TRANSACTION_STOP]: 'StopTransaction',
  [EventCommandEnum.EVENT_RESERVATION]: 'ReserveNow',
  [EventCommandEnum.EVENT_CHANGE_AVAILABILITY]: 'ChangeAvailability',
};

let queue = [];

function register(commandId, packetData, callback) {
  const commandName = EventCommandNameEnum[commandId];

  Logger.info(
    `Register ${commandName}`
    // args.transactionId
  );

  queue.push({
    commandId,
    packetData,
    callback,
    status: 'queue',
  });

  return process();
}

function getPreviousCommandId() {
  const queueItem = queue.find(function (queue) {
    return queue.status == 'finished';
  });

  if (!queueItem) {
    return null;
  }

  return queueItem.commandId;
}

function cleanup() {
  queue = queue.filter(function (queue) {
    return queue.status != 'finished';
  });
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

// setInterval(function () {
//   print();
// }, 200);

module.exports = {
  EventCommandEnum: EventCommandEnum,
  EventCommandNameEnum: EventCommandNameEnum,
  EventQueue: {
    register: register,
    getPreviousCommandId: getPreviousCommandId,
    cleanup: cleanup,
    process: process,
    print: print,
  },
};
