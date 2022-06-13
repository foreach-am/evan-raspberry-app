const CoreEventEnum = {
  EVENT_UNCAUGHT_EXCEPTION: 'uncaughtException',
  EVENT_UNHANDLED_REJECTION: 'unhandledRejection',
  EVENT_USIGNINT: 'SIGINT',
};

const events = {};

function tryFillEvent(eventName) {
  events[eventName] = events[eventName] || {
    callbacks: {},
    currentIndex: 0,
  };
}

function register(eventName, callback) {
  tryFillEvent(eventName);

  const callbackId = ++events[eventName].currentIndex;
  events[eventName].callbacks[callbackId] = callback;

  return {
    callback: callbackId,
    eventName: eventName,
  };
}

function unregister(callbackId) {
  const { callback, eventName } = callbackId;
  delete events[eventName].callbacks[callback];
}

Object.keys(CoreEventEnum).forEach(function (eventName) {
  tryFillEvent(eventName);

  process.on(eventName, function (event) {
    tryFillEvent(eventName);

    const callbacks = events[eventName].callbacks;

    for (const callback of callbacks) {
      if (typeof callback !== 'function') {
        continue;
      }

      callback(event);
    }
  });
});

module.exports = {
  CoreEventEnum: CoreEventEnum,
  CoreEvent: {
    register: register,
    unregister: unregister,
  },
};
