module.exports = {
  onComportOpen: require('./events/onComportOpen'),
  onWebsocketMessage: require('./events/onWebsocketMessage'),

  registerMeterValueInterval: require('./register/registerMeterValueInterval'),
};
