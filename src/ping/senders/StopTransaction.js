const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const state = require('../../state');

const event = EventCommandEnum.EVENT_TRANSACTION_STOP;

function sendStopTransaction({ messageId, connectorId }) {
  WebSocketSender.send(SendTypeEnum.Request, event, messageId, {
    transactionId: state.state.plugs.transactionId[connectorId],
    idTag: state.state.plugs.idTags[connectorId],
    timestamp: new Date().toISOString(),
    meterStop: 20, // connector power KW/h
  });

  state.state.plugs.transactionId[connectorId] = '';
  state.state.plugs.idTags[connectorId] = '';
}

function sendStopTransactionHandler(messageId, connectorId) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
  };

  return EventQueue.register(event, connectorId, data, sendStopTransaction);
}

module.exports = {
  execute: sendStopTransactionHandler,
};
