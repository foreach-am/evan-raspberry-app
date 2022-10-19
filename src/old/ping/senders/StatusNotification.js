const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_STATUS_NOTIFICATION;

function sendStatusNotification({ messageId, connectorId, status, error }) {
  const commandArgs = {
    connectorId: connectorId,
    errorCode: error,
    status: status,
    timestamp: new Date().toISOString(),
  };

  WebSocketSender.send({
    sendType: SendTypeEnum.Request,
    commandId: event,
    messageId: messageId,
    commandArgs: commandArgs,
  });
}

function sendStatusNotificationHandler(messageId, connectorId, status, error) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
    status: status,
    error: error,
  };

  return EventQueue.register({
    commandId: event,
    connectorId: connectorId,
    messageId: messageId,
    packetData: data,
    callback: sendStatusNotification,
  });
}

const ErrorCodeEnum = {
  CONNECTOR_LOCK_FAILURE: 'ConnectorLockFailure',
  EV_COMMUNICATION_ERROR: 'EVCommunicationError',
  GROUND_FAILURE: 'GroundFailure',
  HIGH_TEMPERATURE: 'HighTemperature',
  INTERNAL_ERROR: 'InternalError',
  LOCAL_LIST_CONFLICT: 'LocalListConflict',
  NO_ERROR: 'NoError',
  OTHER_ERROR: 'OtherError',
  OVER_CURRENT_FAILURE: 'OverCurrentFailure',
  POWER_METER_ERROR: 'PowerMeterFailure',
  POWER_SWITCH_FAILURE: 'PowerSwitchFailure',
  READER_FAILURE: 'ReaderFailure',
  RESET_FAILURE: 'ResetFailure',
  UNDER_VOLTAGE: 'UnderVoltage',
  OVER_VOLTAGE: 'OverVoltage',
  WEAK_SIGNAL: 'WeakSignal',
};

const StatusEnum = {
  AVAILABLE: 'Available',
  PREPARING: 'Preparing',
  CHARGING: 'Charging',
  SUSPENDED_EVSE: 'SuspendedEVSE',
  SUSPENDED_EV: 'SuspendedEV',
  FINISHING: 'Finishing',
  RESERVED: 'Reserved',
  UNAVAILABLE: 'Unavailable',
  FAULTED: 'Faulted',
};

module.exports = {
  execute: sendStatusNotificationHandler,
  ErrorCodeEnum: ErrorCodeEnum,
  StatusEnum: StatusEnum,
};
