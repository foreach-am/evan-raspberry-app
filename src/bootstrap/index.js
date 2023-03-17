module.exports = {
  onComportOpen: require('./events/onComportOpen'),
  onWebsocketEvent: require('./events/onWebsocketEvent'),

  registerMeterValueInterval: require('./register/registerMeterValueInterval'),
};
