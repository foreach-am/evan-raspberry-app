const { Logger } = require('./Logger');

const EventQueueEnum = {
  EVENT_BOOT_NOTIFICATION: 1,
  EVENT_HEARTHBEAT: 2,
  EVENT_AUTHORIZE: 3,
  EVENT_TRANSACTION_START: 4,
  EVENT_TRANSACTION_STOP: 5,
  EVENT_RESERVE_ACCEPT: 6,
};

let queue = [];

function register(commandId, packetData, callback) {
  Logger.info(
    `Register ${commandName}`,
    args.connection.connected,
    args.transactionId
  );

  queue.push({
    commandId,
    packetData,
    callback,
    status: 'queue',
  });

  return this.process();
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
        // console.log('--------->>> IN QUEUE:', queue.map(function (i) {
        //     return ({
        //         c: i.commandId,
        //         s: i.status,
        //     });
        // }));

        resolve(this.process());
      }, 100);
    });
  }

  queueItem.status = 'running';

  const onFinish = function (resolve) {
    // console.log('--------->>> finished:', queueItem.commandId);
    queueItem.status = 'finished';
    resolve();
  };

  return new Promise(function (resolve) {
    // console.log(queueItem);
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
  console.log(
    '--------->>> ',
    queue.map(function (i) {
      return {
        c: i.commandId,
        s: i.status,
      };
    })
  );
}

module.exports = {
  EventQueueEnum: EventQueueEnum,
  EventQueue: {
    register: register,
    getPreviousCommandId: getPreviousCommandId,
    cleanup: cleanup,
    process: process,
    print: print,
  },
};
