module.exports = {
  onComportOpen: require('./events/onComportOpen'),
  registerWebsocketEvents: require('./events/registerWebsocketEvents'),

  registerMeterValueInterval: require('./register/registerMeterValueInterval'),
};
