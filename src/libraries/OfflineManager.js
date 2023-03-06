const fs = require('fs');
const DataManager = require('./DataManager');
const uuid = require('../utils/uuid');

function saveFile(fileName, data) {
  const updatedContent = JSON.stringify(data);
  fs.writeFileSync(DataManager.getFilePath(fileName), updatedContent, 'utf-8');
}

function getCommandFiles() {
  return fs.readdirSync(DataManager.getFilePath()).filter(function (fileName) {
    return /^offline\-.+\.json$/.test(fileName);
  });
}

function pushCommand(commandValue) {
  const fileName = 'offline-' + Date.now() + '-' + uuid() + '.json';
  saveFile(fileName, commandValue);
}

function firstCommand() {
  const files = getCommandFiles();
  if (files.length === 0) {
    return null;
  }

  const filePath = DataManager.getFilePath(files[0]);
  const content = fs.readFileSync(filePath);
  fs.unlinkSync(filePath);

  return JSON.parse(content);
}

function saveCurrentState(state, statistic) {
  if (!state || !state.plugs || !statistic || !statistic.plugs) {
    return;
  }

  const stateFile = DataManager.getFilePath('charge-state.json');
  const content = JSON.stringify({
    idTags: state.plugs.idTags,
    transactionId: state.plugs.transactionId,
    reservationId: state.plugs.reservationId,
    plugState: statistic.plugs.plugState,
  });

  fs.writeFileSync(stateFile, content);
}

function fillSavedState(state, statistic) {
  const stateFile = DataManager.getFilePath('charge-state.json');
  if (fs.existsSync(stateFile)) {
    try {
      const savedState = JSON.parse(fs.readFileSync(stateFile));
      if (!savedState) {
        return;
      }

      state.plugs.idTags = savedState?.idTags;
      state.plugs.transactionId = savedState?.transactionId;
      state.plugs.reservationId = savedState?.reservationId;
    } catch (e) {
      console.error(e);
    }
  }
}

let lastTimeInterval = null;
function registerLastTimeInterval(seconds) {
  const filePath = DataManager.getFilePath('last-time.data');

  clearInterval(lastTimeInterval);
  const interval = seconds * 1_000;

  lastTimeInterval = setInterval(() => {
    fs.writeFileSync(filePath, new Date().toISOString(), 'utf-8');
  }, interval);
}

function getLastTimeSaved() {
  const filePath = DataManager.getFilePath('last-time.data');
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  return null;
}

module.exports = {
  OfflineCommand: {
    push: pushCommand,
    first: firstCommand,
  },
  StateKeeper: {
    saveState: saveCurrentState,
    fillSavedState: fillSavedState,
  },
  LastTime: {
    register: registerLastTimeInterval,
    getLastTime: getLastTimeSaved,
  },
};
