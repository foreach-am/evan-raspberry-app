const { Logger } = require('../../libraries/Logger');

const ping = require('../../ping');
const uuid = require('../../utils/uuid');

module.exports = async function (parsedServerData) {
  // @TODO: handle configuration change

  Logger.json('ChangeConfiguration server request:', parsedServerData);

  await ping.ChangeConfiguration.execute(uuid(), ping.ChangeConfiguration.StatusEnum.NOT_SUPPORTED);
};
