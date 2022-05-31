function logInfo(...args) {
  console.log('-->>  INFO:', ...args);
}

function logError(...args) {
  console.error('-->> ERROR:', ...args);
}

function logWarning(...args) {
  console.warn('-->>  WARN:', ...args);
}

module.exports = {
  Logger: {
    info: logInfo,
    warning: logWarning,
    error: logError,
  },
};
