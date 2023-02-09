const path = require('path');
const fs = require('fs');
const uuid = require('../utils/uuid');

function getFilePath(...fileName) {
  return path.join(__dirname, '..', '..', 'data', ...fileName);
}

function saveFile(fileName, data) {
  const updatedContent = JSON.stringify(data);
  fs.writeFileSync(getFilePath(fileName), updatedContent, 'utf-8');
}

function getCommandFiles() {
  return fs.readdirSync(getFilePath()).filter(function (fileName) {
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

  const filePath = getFilePath(files[0]);
  const content = fs.readFileSync(filePath);
  fs.unlinkSync(filePath);

  return JSON.parse(content);
}

function saveCurrentState(state) {
  const stateFile = getFilePath('charge-state.json');

  fs.writeFileSync(
    stateFile,
    JSON.stringify({
      idTags: state.plugs.idTags,
      transactionId: state.plugs.transactionId,
      reservationId: state.plugs.reservationId,
    })
  );
}

function fillSavedState(state) {
  const stateFile = getFilePath('charge-state.json');
  const savedState = JSON.parse(fs.readFileSync(stateFile));

  state.plugs.idTags = savedState.idTags;
  state.plugs.transactionId = savedState.transactionId;
  state.plugs.reservationId = savedState.reservationId;
}

module.exports = {
  OfflineCommand: {
    saveState: saveCurrentState,
    fillSavedState: fillSavedState,
    push: pushCommand,
    first: firstCommand,
  },
};
