const fs = require('fs');
const DataManager = require('./DataManager');
const uuid = require('../utils/uuid');
const { Logger } = require('./Logger');
const sleep = require('../utils/sleep');

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
  const content = fs.readFileSync(filePath, 'utf-8');
  fs.unlinkSync(filePath);

  return JSON.parse(content);
}

function saveCurrentState(state) {
  if (!state || !state.plugs) {
    return;
  }

  const stateFile = DataManager.getFilePath('charge-state.json');
  const content = JSON.stringify({
    idTags: state.plugs.idTags,
    transactionId: state.plugs.transactionId,
    reservationId: state.plugs.reservationId,
  });

  fs.writeFileSync(stateFile, content, 'utf-8');
}

function fillSavedState(state) {
  const stateFile = DataManager.getFilePath('charge-state.json');
  if (!fs.existsSync(stateFile)) {
    return;
  }

  try {
    const savedStateContent = fs.readFileSync(stateFile, 'utf-8');
    if (!savedStateContent || typeof savedStateContent !== 'string') {
      return;
    }

    const savedState = JSON.parse(savedStateContent);
    if (!savedState) {
      return;
    }

    state.plugs.idTags = savedState?.idTags;
    state.plugs.transactionId = savedState?.transactionId;
    state.plugs.reservationId = savedState?.reservationId;
  } catch (e) {
    fs.unlinkSync(stateFile);
    console.error(e);
  }
}

async function updateLastTime() {
  const filePathRealtime = DataManager.getFilePath('last-time-realtime.data');
  const filePathBackup = DataManager.getFilePath('last-time-backup.data');
  const timeNow = new Date().toISOString();

  const writeNewTime = function () {
    if (fs.existsSync(filePathBackup)) {
      fs.unlinkSync(filePathBackup);
    }

    if (fs.existsSync(filePathRealtime)) {
      fs.copyFileSync(
        filePathRealtime,
        filePathBackup,
        fs.constants.COPYFILE_FICLONE
      );
    }

    fs.writeFileSync(filePathRealtime, timeNow, 'utf-8');
  };

  writeNewTime();
  for (let i = 0; i < 4; ++i) {
    await sleep(100);
    const savedTime = getLastTimeSaved();
    if (savedTime && savedTime === timeNow) {
      break;
    } else {
      Logger.warning('SaveTime is not the same, refreshing value ...', {
        timeNow: timeNow,
        savedTime: savedTime,
      });
      writeNewTime();
    }
  }
}

let lastTimeInterval = null;
function registerLastTimeInterval(seconds) {
  clearInterval(lastTimeInterval);
  const interval = seconds * 1_000;

  updateLastTime();
  lastTimeInterval = setInterval(() => {
    updateLastTime();
  }, interval);
}

function getLastTimeSaved() {
  const filePathRealtime = DataManager.getFilePath('last-time-realtime.data');
  const filePathBackup = DataManager.getFilePath('last-time-backup.data');

  let lastTimeSaved = '';
  if (fs.existsSync(filePathRealtime)) {
    try {
      lastTimeSaved = fs.readFileSync(filePathRealtime, 'utf-8');
    } catch (e) {
      Logger.error(e);
    }
  }

  if (lastTimeSaved && fs.existsSync(filePathBackup)) {
    try {
      lastTimeSaved = fs.readFileSync(filePathBackup, 'utf-8');
    } catch (e) {
      Logger.error(e);
    }
  }

  console.log('>>>>>> LastTime:', lastTimeSaved);
  return lastTimeSaved || null;
}

function putRebootReason(reason) {
  const filePath = DataManager.getFilePath('reboot-reason.data');
  try {
    fs.writeFileSync(filePath, reason, 'utf-8');
  } catch (e) {
    // retry writing
    fs.writeFileSync(filePath, reason, 'utf-8');
  }
}

function getRebootReason() {
  const filePath = DataManager.getFilePath('reboot-reason.data');
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const reason = fs.readFileSync(filePath, 'utf-8');
  fs.unlinkSync(filePath);

  return reason;
}

function setComportState(state) {
  const filePath = DataManager.getFilePath('com-state.data');
  fs.writeFileSync(filePath, JSON.stringify(state), 'utf-8');
}

function getComportState() {
  const filePath = DataManager.getFilePath('com-state.data');
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const savedStateContent = fs.readFileSync(filePath, 'utf-8');
    if (!savedStateContent || typeof savedStateContent !== 'string') {
      Logger.warning('savedStateContent', savedStateContent);
      return {};
    }

    const savedState = JSON.parse(savedStateContent);
    Logger.warning('savedState', savedState);

    return savedState || {};
  } catch (e) {
    Logger.error(e);
  }
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
  ComState: {
    set: setComportState,
    get: getComportState,
  },
  Reboot: {
    putReason: putRebootReason,
    getReason: getRebootReason,
  },
};
