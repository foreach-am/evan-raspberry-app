module.exports = {
  BootNotification: require('./senders/BootNotification'),
  Authorize: require('./senders/Authorize'),
  HearthBeat: require('./senders/HearthBeat'),
  StartTransaction: require('./senders/StartTransaction'),
  StopTransaction: require('./senders/StopTransaction'),
  Reservation: require('./senders/Reservation'),
  ChangeAvailability: require('./senders/ChangeAvailability'),
  StatusNotification: require('./senders/StatusNotification'),
};
