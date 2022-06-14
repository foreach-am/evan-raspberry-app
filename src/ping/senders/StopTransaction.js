const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_STOP_TRANSACTION;

function sendStopTransaction({ messageId, connectorId }) {
  WebSocketSender.send({
    sendType: SendTypeEnum.Request,
    commandId: event,
    messageId: messageId,
    commandArgs: {
      transactionId: state.state.plugs.transactionId[connectorId],
      idTag: state.state.plugs.idTags[connectorId],
      timestamp: new Date().toISOString(),
      meterStop: 20, // connector power KW/h
    },
  });

  state.state.plugs.transactionId[connectorId] = '';
  state.state.plugs.idTags[connectorId] = '';
}

function sendStopTransactionHandler(messageId, connectorId) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
  };

  return EventQueue.register({
    commandId: event,
    connectorId: connectorId,
    messageId: data,
    packetData: messageId,
    callback: sendStopTransaction,
  });
}

module.exports = {
  execute: sendStopTransactionHandler,
};
