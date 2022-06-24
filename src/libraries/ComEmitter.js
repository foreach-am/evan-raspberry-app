const { ComPort } = require('./ComPort');

function emitMasterRead() {
  return ComPort.emit('MASTERREAD:');
}

function emitStartRun() {
  ComPort.startIdleChecker();
  return ComPort.emit('STARTRUN:');
}

function emitExtLedOn() {
  // return ComPort.emit('EXTLEDON:');
}

function emitExtLedOff() {
  // return ComPort.emit('EXTLEDOFF:');
  return ComPort.emit('EXTLEDOF:');
}

function emitProxire(connectorId) {
  return ComPort.emit(`PROXIRE${connectorId}:`);
}

function emitPlugStop(connectorId) {
  return ComPort.emit(`PLUG${connectorId}STOP:`);
}

function emitPlugOn(connectorId) {
  return ComPort.emit(`PLUG${connectorId}ONN:`);
}

function emitPlugOff(connectorId) {
  return ComPort.emit(`PLUG${connectorId}OFF:`);
}

module.exports = {
  ComEmitter: {
    masterRead: emitMasterRead,
    startRun: emitStartRun,
    extLedOn: emitExtLedOn,
    extLedOff: emitExtLedOff,
    proxire: emitProxire,
    plugStop: emitPlugStop,
    plugOn: emitPlugOn,
    plugOff: emitPlugOff,
  },
};
