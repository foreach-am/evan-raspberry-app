const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_CHANGE_CONFIGURATION;

function sendChangeConfiguration({ messageId, status }) {
  const commandArgs = {
    status: status,
  };

  WebSocketSender.send({
    sendType: SendTypeEnum.Response,
    commandId: event,
    messageId: messageId,
    commandArgs: commandArgs,
  });
}

function sendChangeConfigurationHandler(messageId, status) {
  const data = {
    messageId: messageId,
    status: status,
  };

  return EventQueue.register({
    commandId: event,
    messageId: messageId,
    packetData: data,
    callback: sendChangeConfiguration,
  });
}

const StatusEnum = {
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  REBOOT_REQUIRED: 'RebootRequired',
  NOT_SUPPORTED: 'NotSupported',
};

module.exports = {
  execute: sendChangeConfigurationHandler,
  StatusEnum: StatusEnum,
};
