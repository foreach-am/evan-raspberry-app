const rc522 = require('rc522-rfid-promise');
const { Logger } = require('./Logger');
const { CoreEvent, CoreEventEnum } = require('./CoreEvent');

let callbackIndex = 0;
let callbacks = [];

function register(callback) {
  callbacks[++callbackIndex] = callback;
  return callbackIndex;
}

function unregister(callbackId) {
  delete callbacks[callbackId];
}

function trigger(serialNumber) {
  for (const callback of callbacks) {
    if (typeof callback !== 'function') {
      continue;
    }

    callback(serialNumber);
  }
}

rc522
  .startListening(1000)
  .then(function (serialNumber) {
    Logger.info('RC522 serial number received:', serialNumber);
    trigger(serialNumber);
  })
  .catch(function (error) {
    Logger.info('RC522 failed:', error);
  });

function onExit() {
  rc522.stopListening();
  Logger.info('RC522 stopped.');
}

CoreEvent.register(CoreEventEnum.EVENT_UNCAUGHT_EXCEPTION, onExit);
CoreEvent.register(CoreEventEnum.EVENT_UNHANDLED_REJECTION, onExit);
CoreEvent.register(CoreEventEnum.EVENT_USIGNINT, onExit);

module.export = {
  RFID: {
    register: register,
    unregister: unregister,
  },
};
