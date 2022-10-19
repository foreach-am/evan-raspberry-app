/* eslint-disable @typescript-eslint/no-non-null-assertion */

import Logger from './Logger';

class LightController {
  private static instance: Nullable<LightController> = null;

  static getInstance(): LightController {
    if (!LightController.instance) {
      LightController.instance = new LightController();
    }

    return LightController.instance;
  }

  private constructor() {}

  private interval: Nullable<NodeJS.Timeout> = null;
  private startTime: Nullable<string> = null;
  private endTime: Nullable<string> = null;

  private timeToNumber(time: string) {
    const [hour, minute, second] = time.split(':').map((item) => {
      return parseInt(item);
    });

    return (hour * 60 + minute) * 60 + (second || 0);
  }

  private getCurrentTime() {
    const date = new Date();

    return [
      date.getHours().toString().padStart(2, '0'),
      date.getMinutes().toString().padStart(2, '0'),
      date.getSeconds().toString().padStart(2, '0'),
    ].join(':');
  }

  private setStartTime(time: string) {
    this.startTime = time;
  }

  private setEndTime(time: string) {
    this.endTime = time;
  }

  private checkInSameDay() {
    const currentTime = this.getCurrentTime();
    if (currentTime >= this.startTime! && currentTime <= this.endTime!) {
      ComEmitter.extLedOn();
    } else {
      ComEmitter.extLedOff();
    }
  }

  private checkDifferentDays() {
    const currentTime = this.getCurrentTime();
    if (currentTime >= this.startTime! && currentTime <= this.endTime!) {
      ComEmitter.extLedOff();
    } else {
      ComEmitter.extLedOn();
    }
  }

  private startChecking() {
    if (this.startTime === null || this.endTime === null) {
      Logger.warning(
        'LIGHT CONTROLLER: [SKIPPING] start time and/or end time is not set.'
      );
      return;
    }

    const currentTime = this.getCurrentTime();

    const startTimeNum = this.timeToNumber(this.startTime);
    const endTimeNum = this.timeToNumber(this.endTime);
    const currentTimeNum = this.timeToNumber(currentTime);

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
        `start=${this.startTime}=${startTimeNum}, ` +
        `end=${this.endTime}=${endTimeNum}, ` +
        `state=${state}.`
    );

    if (isEnabled) {
      ComEmitter.extLedOn();
    } else {
      ComEmitter.extLedOff();
    }
  }

  start(
    intervalSeconds: number,
    startTimeString: Nullable<string> = null,
    endTimeString: Nullable<string> = null
  ) {
    if (startTimeString) {
      this.setStartTime(startTimeString);
    }

    if (endTimeString) {
      this.setEndTime(endTimeString);
    }

    if (this.interval) {
      clearInterval(this.interval);
    }

    this.startChecking();
    this.interval = setInterval(() => {
      this.startChecking();
    }, intervalSeconds * 1000);
  }
}

export default LightController;
