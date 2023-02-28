module.exports = {
  onComportOpen: require('./events/onComportOpen'),
  onWebsocketMessage: require('./events/onWebsocketMessage'),
  registerMeterValueInterval: require('./events/registerMeterValueInterval'),
  notifyDeviceBoot: require('./events/notifyDeviceBoot'),
};
