const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_TRANSACTION_STOP;

function sendStatusNotification({ connectorId, status, error }) {
  WebSocketSender.send(event, {
    connectorId: connectorId,
    errorCode: error,
    status: status,
  });
}

function sendStatusNotificationHandler(connectorId, status, error) {
  const data = {
    connectorId: connectorId,
    status: status,
    error: error,
  };

  return EventQueue.register(event, connectorId, data, sendStatusNotification);
}

const ErrorCodeEnum = {
  ConnectorLockFailure: 'ConnectorLockFailure',
  EVCommunicationError: 'EVCommunicationError',
  GroundFailure: 'GroundFailure',
  HighTemperature: 'HighTemperature',
  InternalError: 'InternalError',
  LocalListConflict: 'LocalListConflict',
  NoError: 'NoError',
  OtherError: 'OtherError',
  OverCurrentFailure: 'OverCurrentFailure',
  PowerMeterFailure: 'PowerMeterFailure',
  PowerSwitchFailure: 'PowerSwitchFailure',
  ReaderFailure: 'ReaderFailure',
  ResetFailure: 'ResetFailure',
  UnderVoltage: 'UnderVoltage',
  OverVoltage: 'OverVoltage',
  WeakSignal: 'WeakSignal',
};

const StatusEnum = {
  Available: 'Available',
  Preparing: 'Preparing',
  Charging: 'Charging',
  SuspendedEVSE: 'SuspendedEVSE',
  SuspendedEV: 'SuspendedEV',
  Finishing: 'Finishing',
  Reserved: 'Reserved',
  Unavailable: 'Unavailable',
  Faulted: 'Faulted',
};

module.exports = {
  execute: sendStatusNotificationHandler,
  enums: {
    ErrorCodeEnum: ErrorCodeEnum,
    StatusEnum: StatusEnum,
  },
};
