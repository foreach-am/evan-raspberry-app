module.exports = {
  PingReserveNow: require('./executions/PingReserveNow'),
  ChangeConnectorAvailability: require('./executions/ChangeConnectorAvailability'),
  PingAndStartTransaction: require('./executions/PingAndStartTransaction'),
  PingAndStopTransaction: require('./executions/PingAndStopTransaction'),
  PingAndReset: require('./executions/PingAndReset'),
  BootNotification: require('./executions/BootNotification'),
  HearthBeat: require('./executions/HearthBeat'),
  UpdateFlagAuthorize: require('./executions/UpdateFlagAuthorize'),
  UpdateFlagStartTransaction: require('./executions/UpdateFlagStartTransaction'),
  UpdateFlagStopTransaction: require('./executions/UpdateFlagStopTransaction'),
};
