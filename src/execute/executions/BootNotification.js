const state = require('../../state');
const ping = require('../../ping');
const uuid = require('../../utils/uuid');

module.exports = async function (parsedServerData, onFinish) {
  state.state.common.bootNotRequireTime = Number(
    parsedServerData.body.interval
  );
  state.state.common.bootNotStatus = parsedServerData.body.status;
  state.state.common.bootNotCurrentTime = parsedServerData.body.currentTime;

  await ping.Heartbeat.execute(uuid());

  if (typeof onFinish === 'function') {
    onFinish();
  }
};
