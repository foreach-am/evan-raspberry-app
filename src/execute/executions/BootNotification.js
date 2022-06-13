const state = require('../../state');
const ping = require('../../ping');
const uuid = require('../../utils/uuid');

module.exports = async function (parsedSocketData) {
  state.state.common.bootNotStatus = parsedSocketData.body.status;
  state.state.common.bootNotCurrentTime = parsedSocketData.body.currentTime;
  state.state.common.bootNotRequireTime = Number(parsedSocketData.body.interval);

  await ping.HearthBeat.execute(uuid());
};
