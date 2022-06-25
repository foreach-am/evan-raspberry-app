const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '..', '..', 'data', 'offline-command.json');
if (!fs.existsSync(filePath)) {
  saveFile([]);
}

function saveFile(data) {
  const updatedContent = JSON.stringify(data);
  fs.writeFileSync(filePath, updatedContent, 'utf-8');
}

function withOfflineCommands(callback) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, 'utf-8', function (error, content) {
      if (error) {
        return reject(error);
      }

      const parsedData = JSON.parse(content);
      const { data: updatedData, resolveData } = callback(parsedData);

      try {
        saveFile(updatedData, resolveData);

        if (resolveData) {
          resolve(resolveData);
        } else {
          resolve();
        }
      } catch (error) {
        return reject(error);
      }
    });
  });
}

function pushCommand(commandValue) {
  return withOfflineCommands(function (data) {
    data.push(commandValue);

    return {
      resolveData: null,
      data,
    };
  });
}

function shiftCommand() {
  return withOfflineCommands(function (data) {
    const first = data.shift();

    return {
      resolveData: first,
      data,
    };
  });
}

function firstCommand() {
  return withOfflineCommands(function (data) {
    const first = data[0];

    return {
      resolveData: first,
      data,
    };
  });
}

module.exports = {
  OfflineCommand: {
    push: pushCommand,
    shift: shiftCommand,
    first: firstCommand,
  },
};
