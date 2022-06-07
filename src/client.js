const { Logger } = require('./libraries/Logger');
const { WebSocket } = require('./libraries/WebSocket');
const { ComPort } = require('./libraries/ComPort');
const {
  EventQueue,
  EventCommandEnum,
  EventCommandNameEnum,
} = require('./libraries/EventQueue');
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
  const append = function (key, value) {
    logResult[key.padStart(20, ' ')] = value;
  };

  const logResult = {};

  append('Temperature', `${state.statistic.common.temperature} C`);
  append('HighVoltError', `${state.statistic.common.highVoltError} State`);
  append('LowVoltError', `${state.statistic.common.lowVoltError} State`);
  append(
    'HighVoltageMeasure',
    `${state.statistic.common.highVoltageMeasure} V.AC`
  );

  for (let i = 1; i <= state.maxPlugsCount; ++i) {
    append(`PlugState[${i}]`, `${state.statistic.plugs.plugState[i]} State`);
    append(`PowerKwH[${i}]`, `${state.statistic.plugs.powerKwh[i]} KW/h`);
    append(`FeedBackVolt[${i}]`, `${state.statistic.plugs.pilotFeedBack[i]} V`);
    append(
      `CurrentMeasureA[${i}]`,
      `${state.statistic.plugs.currentMeasureA[i]} A`
    );
    append(
      `CurrentMeasureB[${i}]`,
      `${state.statistic.plugs.currentMeasureB[i]} A`
    );
    append(
      `CurrentMeasureC[${i}]`,
      `${state.statistic.plugs.currentMeasureC[i]} A`
    );
    append(
      `OverCurrentError[${i}]`,
      `${state.statistic.plugs.overCurrentError[i]} State`
    );
  }

  Logger.json('Received data is ready:', logResult);
}

WebSocket.onConnect(async function (connection) {
  async function onDataReady() {
    //connection.emit(data);
    logParseData();

    for (let i = 1; i <= state.maxPlugsCount; ++i) {
      if (state.statistic.plugs[i] === PlugStateEnum.UNPLUGGED) {
        state.switch.plugs.startTransaction[i] = true;
        state.switch.plugs.stopTransaction[i] = true;
        state.switch.plugs.sendAuth[i] = true;
        state.switch.plugs.chargeStart[i] = true;
        state.state.plugs.transactionId[i] = 0;
      }

      if (
        state.statistic.plugs[i] === PlugStateEnum.PLUG_SOFT_LOCK &&
        !state.switch.plugs.softLock[i]
      ) {
        state.switch.plugs.softLock[i] = true;
        // lock
      }

      if (
        state.statistic.plugs[i] === PlugStateEnum.CAR_DETECTED &&
        state.switch.plugs[i].sendAuth
      ) {
        state.switch.plugs[i].sendAuth = false;
        await ping.sendAuthorize();
      }

      if (
        state.state.plugs.idTagInfoStatus[i] === 'Accepted' &&
        state.switch.plugs.startTransaction[i]
      ) {
        state.state.plugs.idTagInfoStatus[i] = '';
        state.switch.plugs.startTransaction[i] = false;

        await ping.sendStartTransaction();
      }

      if (
        state.state.plugs.startTransactionStatus[i] === 'Accepted' &&
        state.switch.plugs.chargeStart[i]
      ) {
        state.state.plugs.startTransactionStatus[i] = '';
        state.switch.plugs.chargeStart[i] = false;

        ComPort.emit('PROXIRE1:');
      }

      if (
        state.statistic.plugs[i] === PlugStateEnum.CHARGING &&
        state.switch.plugs.chargingPeriodAuth[i]
      ) {
        state.switch.plugs.chargingPeriodAuth[i] = false;
        await ping.sendAuthorize();
      }

      if (
        state.statistic.plugs[i] === PlugStateEnum.CHARGE_COMPLETED &&
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
    const parseData = JSON.parse(message.utf8Data);

    Logger.json('WebSocket data received:', parseData);
    switch (commandId) {
      case EventCommandEnum.EVENT_BOOT_NOTIFICATION:
        const bootNotificationResult = parseData[2];
        state.bootNotStatus = bootNotificationResult.status;
        state.bootNotCurrentTime = bootNotificationResult.currentTime;
        state.bootNotRequireTime = Number(bootNotificationResult.interval);

        await ping.sendHearthBeat(bootNotificationResult);
        break;

      case EventCommandEnum.EVENT_HEARTH_BEAT:
        break;

      case EventCommandEnum.EVENT_AUTHORIZE:
        const authorizeResult = parseData[2];
        state.idTagInfoStatus = authorizeResult.idTagInfo.status;
        state.chargingPeriodAuthSwitch = true;
        break;

      case EventCommandEnum.EVENT_TRANSACTION_START:
        const startTransactionResult = parseData[2];
        state.transactionId = startTransactionResult.transactionId;
        state.startTransactionStatus = startTransactionResult.idTagInfo.status;
        break;

      case EventCommandEnum.EVENT_TRANSACTION_STOP:
        const stopTransactionResult = parseData[2];
        state.stopTransactionStatus = stopTransactionResult.idTagInfo.status;
        break;

      default:
        state.receiveCommand = parseData[2];

        switch (state.receiveCommand) {
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
    }

    EventQueue.cleanup();
  });

  comportHandlerId = ComPort.register(onDataReady);

  WebSocket.register('close', function () {
    ComPort.unregister(comportHandlerId);
  });

  ping.sendBootNotification();
});

WebSocket.startServer();
