module.exports = {
  PingReserveNow: require('./executions/PingReserveNow'),
  ChangeConnectorAvailability: require('./executions/ChangeConnectorAvailability'),
  PingAndRemoteStartTransaction: require('./executions/PingAndRemoteStartTransaction'),
  PingAndRemoteStopTransaction: require('./executions/PingAndRemoteStopTransaction'),
  PingAndStartTransaction: require('./executions/PingAndStartTransaction'),
  PingAndReset: require('./executions/PingAndReset'),
  BootNotification: require('./executions/BootNotification'),
  HearthBeat: require('./executions/HearthBeat'),
  UpdateFlagAuthorize: require('./executions/UpdateFlagAuthorize'),
  UpdateFlagStartTransaction: require('./executions/UpdateFlagStartTransaction'),
  UpdateFlagStopTransaction: require('./executions/UpdateFlagStopTransaction'),
  NotifyMeretValues: require('./executions/NotifyMeretValues'),
};
