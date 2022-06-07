const { Logger } = require('./libraries/Logger');
const { WebSocket } = require('./libraries/WebSocket');
const { ComPort } = require('./libraries/ComPort');
const { EventQueue, EventCommandEnum, EventCommandNameEnum } = require('./libraries/EventQueue');
const { PlugStateEnum } = require('./libraries/PlugState');
// const { Raspberry } = require('./libraries/Raspberry');

const state = require('./state');
const ping = require('./ping');

let comportHandlerId = -1;

function logParseData() {
  /**
   *
   * @param {string} key
   * @param {*} value
   */
  const append = function (key, value, char = ' ') {
    logResult[key.padStart(22, char)] = value;
  };

  const logResult = {};

  const { temperature, highVoltError, lowVoltError, highVoltageMeasure } = state.statistic.common;

  const {
    pilotFeedBack,
    currentMeasureA,
    currentMeasureB,
    currentMeasureC,
    overCurrentError,
    plugState,
    powerKwh,
  } = state.statistic.plugs;

  append(` DEVICE LOG`, '----------------------------------------', '-');
  append('Device Temperature', `${temperature} C`);
  append('HighVoltError', `${highVoltError} State`);
  append('LowVoltError', `${lowVoltError} State`);
  append('HighVoltageMeasure', `${highVoltageMeasure} V.AC`);

  for (let i = 1; i <= state.maxPlugsCount; ++i) {
    append(` PLUG LOG [${i}]`, '----------------------------------------', '-');
    append(`PlugState[${i}]`, `${plugState[i]} State`);
    append(`PowerKwH[${i}]`, `${powerKwh[i]} KW/h`);
    append(`FeedBackVolt[${i}]`, `${pilotFeedBack[i]} V`);
    append(`CurrentMeasureA[${i}]`, `${currentMeasureA[i]} A`);
    append(`CurrentMeasureB[${i}]`, `${currentMeasureB[i]} A`);
    append(`CurrentMeasureC[${i}]`, `${currentMeasureC[i]} A`);
    append(`OverCurrentError[${i}]`, `${overCurrentError[i]} State`);
  }

  Logger.json('Received data is ready:', logResult);
}

WebSocket.onConnect(async function (connection) {
  async function onDataReady() {
    //connection.emit(data);
    logParseData();

    for (let i = 1; i <= state.maxPlugsCount; ++i) {
      if (state.statistic.plugs.plugState[i] === PlugStateEnum.UNPLUGGED) {
        state.switch.plugs.startTransaction[i] = true;
        state.switch.plugs.stopTransaction[i] = true;
        state.switch.plugs.sendAuth[i] = true;
        state.switch.plugs.chargeStart[i] = true;
        state.state.plugs.transactionId[i] = 0;
      }

      if (
        state.statistic.plugs.plugState[i] === PlugStateEnum.PLUG_SOFT_LOCK &&
        !state.switch.plugs.softLock[i]
      ) {
        state.switch.plugs.softLock[i] = true;
        await ping.sendChangeAvailability();
      }

      if (
        state.statistic.plugs.plugState[i] === PlugStateEnum.CAR_DETECTED &&
        state.switch.plugs.sendAuth[i]
      ) {
        state.switch.plugs.sendAuth[i] = false;
        await ping.sendAuthorize();
      }

      if (state.state.plugs.idTagInfoStatus[i] === 'Accepted' && state.switch.plugs.startTransaction[i]) {
        state.state.plugs.idTagInfoStatus[i] = '';
        state.switch.plugs.startTransaction[i] = false;

        await ping.sendStartTransaction();
      }

      if (state.state.plugs.startTransactionStatus[i] === 'Accepted' && state.switch.plugs.chargeStart[i]) {
        state.state.plugs.startTransactionStatus[i] = '';
        state.switch.plugs.chargeStart[i] = false;

        ComPort.emit('PROXIRE1:');
      }

      if (
        state.statistic.plugs.plugState[i] === PlugStateEnum.CHARGING &&
        state.switch.plugs.chargingPeriodAuth[i]
      ) {
        state.switch.plugs.chargingPeriodAuth[i] = false;
        await ping.sendAuthorize();
      }

      if (
        state.statistic.plugs.plugState[i] === PlugStateEnum.CHARGE_COMPLETED &&
        state.switch.plugs.stopTransaction[i]
      ) {
        state.switch.plugs.stopTransaction[i] = false;
        await ping.sendStopTransaction();

        state.state.plugs.idTagInfoStatus[i] = '';
      }

      if (state.state.plugs.stopTransactionStatus[i] === 'Accepted') {
        state.state.plugs.stopTransactionStatus[i] = '';
        state.state.plugs.idTagInfoStatus[i] = '';

        Logger.interval('Charge completed.');
      }
    }
  }

  WebSocket.register('message', async function (message) {
    if (message.type !== 'utf8') {
      return;
    }

    const commandId = EventQueue.getPreviousCommandId();
    const connectorId = 1;

    const parseData = JSON.parse(message.utf8Data);

    Logger.json('WebSocket data received:', parseData);

    const isServerCommand = EventQueue.isServerCommand(parseData[2]);

    console.log('-----------------------------------------');
    console.log('-----------------------------------------');
    console.log('-----------------------------------------');
    console.log('-----------------------------------------');
    console.log('-----------------------------------------');
    console.log('-----------------------------------------');
    console.log('-----------------------------------------');
    console.log(isServerCommand, parseData[2]);
    console.log('-----------------------------------------');
    console.log('-----------------------------------------');
    console.log('-----------------------------------------');
    console.log('-----------------------------------------');
    console.log('-----------------------------------------');
    console.log('-----------------------------------------');

    if (isServerCommand) {
      switch (parseData[2]) {
        case EventCommandNameEnum[EventCommandEnum.EVENT_RESERVATION]:
          state.receiveServerId = parseData[1];
          state.connectorId = parseData[3].connectorId;
          if (state.connectorId === 1) {
            state.expiryDateConnector1 = parseData[3].expiryDate;
          } else if (connectorId === 2) {
            state.expiryDateConnector2 = parseData[3].expiryDate;
          } else {
          }

          state.reservationId = parseData[3].reservationId;
          ping.sendReservation();
          break;

        case EventCommandNameEnum[EventCommandEnum.EVENT_CHANGE_AVAILABILITY]:
          if (parseData[3].connectorId > state.maxPlugsCount) {
            ping.sendChangeAvailability({
              status: 'Rejected',
            });
          } else {
            if (!['Inoperative', 'Operative'].includes(parseData[3].type)) {
              ping.sendChangeAvailability({
                status: 'Rejected',
              });
            } else {
              ping.sendChangeAvailability({
                status: 'Scheduled',
              });

              if (parseData[3].type == 'Inoperative') {
                ComPort.emit(`PLUG${parseData[3].connectorId}OFF:`);
              } else if (parseData[3].type == 'Operative') {
                ComPort.emit(`PLUG${parseData[3].connectorId}ONN:`);
              }
            }
          }
          break;
      }
    } else {
      switch (commandId) {
        case EventCommandEnum.EVENT_BOOT_NOTIFICATION:
          const bootNotificationResult = parseData[2];
          state.state.common.bootNotStatus = bootNotificationResult.status;
          state.state.common.bootNotCurrentTime = bootNotificationResult.currentTime;
          state.state.common.bootNotRequireTime = Number(bootNotificationResult.interval);

          await ping.sendHearthBeat(bootNotificationResult);
          break;

        case EventCommandEnum.EVENT_HEARTH_BEAT:
          break;

        case EventCommandEnum.EVENT_AUTHORIZE:
          const authorizeResult = parseData[2];
          state.state.plugs.idTagInfoStatus[connectorId] = authorizeResult.idTagInfo.status;
          state.switch.plugs.chargingPeriodAuth[connectorId] = true;
          break;

        case EventCommandEnum.EVENT_TRANSACTION_START:
          const startTransactionResult = parseData[2];
          state.state.plugs.transactionId[connectorId] = startTransactionResult.transactionId;
          state.state.plugs.startTransactionStatus[connectorId] = startTransactionResult.idTagInfo.status;
          break;

        case EventCommandEnum.EVENT_TRANSACTION_STOP:
          const stopTransactionResult = parseData[2];
          state.state.plugs.stopTransactionStatus[connectorId] = stopTransactionResult.idTagInfo.status;
          break;
      }

      EventQueue.cleanup();
    }
  });

  comportHandlerId = ComPort.register(onDataReady);

  WebSocket.register('close', function () {
    ComPort.unregister(comportHandlerId);
  });

  ping.sendBootNotification();
});

WebSocket.startServer();
