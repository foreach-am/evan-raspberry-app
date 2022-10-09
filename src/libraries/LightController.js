const { Logger } = require('./Logger');
const { ComEmitter } = require('./ComEmitter');

function timeToNumber(time) {
  const [hour, minute, second] = time.split(':').map(function (item) {
    return parseInt(item);
  });

  return (hour * 60 + minute) * 60 + (second || 0);
}

function getCurrentTime() {
  const date = new Date();

  return [
    date.getHours().toString().padStart(2, '0'),
    date.getMinutes().toString().padStart(2, '0'),
    date.getSeconds().toString().padStart(2, '0'),
  ].join(':');
}

let startTime = null;
let endTime = null;

function setStartTime(time) {
  startTime = time;
}

function setEndTime(time) {
  endTime = time;
}

function startChecking() {
  if (startTime === null || endTime === null) {
    Logger.warning(
      'LIGHT CONTROLLER: [SKIPPING] start time and/or end time is not set.'
    );
    return;
  }

  const currentTime = getCurrentTime();

  const startTimeNum = timeToNumber(startTime);
  const endTimeNum = timeToNumber(endTime);
  const currentTimeNum = timeToNumber(currentTime);

  let isEnabled = false;

  if (startTimeNum > endTimeNum) {
    Logger.info(`LIGHT CONTROLLER: start and end times are in different days.`);

    if (currentTimeNum >= startTimeNum || currentTimeNum <= endTimeNum) {
      isEnabled = true;
    }
  } else {
    Logger.info(`LIGHT CONTROLLER: start and end times are in same day.`);

    if (currentTimeNum >= startTimeNum && currentTimeNum <= endTimeNum) {
      isEnabled = true;
    }
  }

  const state = isEnabled ? 'enabled' : 'disabled';
  Logger.info(
    `LIGHT CONTROLLER: ` +
      `current=${currentTime}=${currentTimeNum}, ` +
      `start=${startTime}=${startTimeNum}, ` +
      `end=${endTime}=${endTimeNum}, ` +
      `state=${state}.`
  );

  if (isEnabled) {
    ComEmitter.extLedOn();
  } else {
    ComEmitter.extLedOff();
  }
}

let interval = null;
function start(intervalSeconds, startTimeString = null, endTimeString = null) {
  if (startTimeString) {
    setStartTime(startTimeString);
  }

  if (endTimeString) {
    setEndTime(endTimeString);
  }

  clearInterval(interval);

  interval = setInterval(startChecking, intervalSeconds * 1_000);
  startChecking();
}

module.exports = {
  LightController: {
    start: start,
    setStartTime: setStartTime,
    setEndTime: setEndTime,
  },
};
