const { Logger } = require('../libraries/Logger');

function parse(message) {
  const parsedServerData = JSON.parse(message);
  // Logger.json('WebSocket data received:', parsedServerData);

  const result = {
    requester: parsedServerData[0],
    messageId: parsedServerData[1],
  };

  if (parsedServerData.length === 4) {
    result.command = parsedServerData[2];
    result.body = parsedServerData[3];
    result.messageType = MessageTypeEnum.TYPE_REQUEST;
  } else {
    result.command = undefined;
    result.body = parsedServerData[2];
    result.messageType = MessageTypeEnum.TYPE_RESPONSE;
  }

  return result;
}

const MessageTypeEnum = {
  TYPE_RESPONSE: 'response',
  TYPE_REQUEST: 'request',
};

const RequestorEnum = {
  REQUESTOR_SERVER: 3,
  REQUESTOR_CLIENT: 2,
  REQUESTOR_ERROR: 2,
};

module.exports = {
  DataParser: {
    parse: parse,
  },
  MessageTypeEnum: MessageTypeEnum,
  RequestorEnum: RequestorEnum,
};
