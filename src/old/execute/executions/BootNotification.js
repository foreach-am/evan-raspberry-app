const state = require('../../state');
const ping = require('../../ping');
const uuid = require('../../utils/uuid');

module.exports = async function (parsedServerData, onFinish) {
  state.state.common.bootNotStatus = parsedServerData.body.status;
  state.state.common.bootNotCurrentTime = parsedServerData.body.currentTime;
  state.state.common.bootNotRequireTime = Number(parsedServerData.body.interval);

  await ping.HearthBeat.execute(uuid());

  if (typeof onFinish === 'function') {
    onFinish();
  }
};
