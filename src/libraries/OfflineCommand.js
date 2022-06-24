const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '..', '..', 'data', 'offline-command.json');

function withDataPromise(callback) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, 'utf-8', function (error, content) {
      if (error) {
        return reject(error);
      }

      const data = JSON.parse(content);
      callback(data, resolve);
    });
  });
}

function pushCommand(commandValue) {
  return withDataPromise(function (data, resolve) {
    data.push(commandValue);
    const updatedContent = JSON.stringify(data);

    fs.writeFile(filePath, updatedContent, 'utf-8', function (error) {
      if (error) {
        return reject(error);
      }

      resolve();
    });
  });
}

function shiftCommand() {
  return withDataPromise(function (data, resolve) {
    const first = data.shift();
    const updatedContent = JSON.stringify(data);

    fs.writeFile(filePath, updatedContent, 'utf-8', function (error) {
      if (error) {
        return reject(error);
      }

      resolve(first);
    });
  });
}

module.exports = {
  OfflineCommand: {
    push: pushCommand,
    shift: shiftCommand,
  },
};
