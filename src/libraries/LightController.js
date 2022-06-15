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
  const time = [
    date.getHours().toString().padStart(2, '0'),
    date.getMinutes().toString().padStart(2, '0'),
    date.getSeconds().toString().padStart(2, '0'),
  ].join(':');

  return timeToNumber(time);
}

let startTime = null;
let endTime = null;

function setStartTime(time) {
  startTime = timeToNumber(time);
}

function setEndTime(time) {
  endTime = timeToNumber(time);
}

function checkInSameDay() {
  const currentTime = getCurrentTime();
  if (currentTime >= startTime && currentTime <= endTime) {
    ComEmitter.extLedOn();
  } else {
    ComEmitter.extLedOff();
  }
}

function checkDifferentDays() {
  const currentTime = getCurrentTime();
  if (currentTime >= startTime && currentTime <= endTime) {
    ComEmitter.extLedOff();
  } else {
    ComEmitter.extLedOn();
  }
}

function startChecking() {
  if (startTime === null || endTime === null) {
    Logger.warning('SKIPPING: Light controller start time and/or end time is not set.');
    return;
  }

  if (startTime > endTime) {
    checkDifferentDays();
  } else {
    checkInSameDay();
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

  interval = setInterval(startChecking, intervalSeconds * 1000);
  startChecking();
}

module.exports = {
  LightController: {
    start: start,
    setStartTime: setStartTime,
    setEndTime: setEndTime,
  },
};
