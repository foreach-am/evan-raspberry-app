function logInfo(...args) {
  console.log('-->>  INFO:', ...args);
}

function logError(...args) {
  console.error('-->> ERROR:', ...args);
}

function logWarning(...args) {
  console.warn('-->>  WARN:', ...args);
}

function logJson(title, ...args) {
  console.log('-->>  JSON:', title);

  const spaces = '          : ';
  args.forEach(function (arg) {
    try {
      let dataString = JSON.stringify(arg, null, 2);
      dataString = dataString.replace(/\n/g, '\n' + spaces);
      dataString = spaces + dataString;

      console.log(dataString);
    } catch (e) {}
  });
}

function logDivider() {
  console.log(
    '==================================================================================='
  );
}

module.exports = {
  Logger: {
    info: logInfo,
    warning: logWarning,
    error: logError,
    json: logJson,
    divider: logDivider,
  },
};
