const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_RESET;

function sendReset({ status, messageId }) {
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

function sendResetHandler(messageId, connectorId, status) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
    status: status,
  };

  return EventQueue.register({
    commandId: event,
    connectorId: connectorId,
    messageId: messageId,
    packetData: data,
    callback: sendReset,
  });
}

const ResetStatusEnum = {
  STATUS_ACCEPTED: 'Accepted',
  STATUS_REJECTED: 'Rejected',
};

const ResetTypeEnum = {
  TYPE_HARDWARE: 'Hard',
  TYPE_SOFTWARE: 'Soft',
};

module.exports = {
  execute: sendResetHandler,
  ResetStatusEnum: ResetStatusEnum,
  ResetTypeEnum: ResetTypeEnum,
};
