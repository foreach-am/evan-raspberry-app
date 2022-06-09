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
    if (process.env.NODE_ENV !== 'production') {
      logParseData();
    }

    //connection.emit(data);
    for (let connectorId = 1; connectorId <= state.maxPlugsCount; ++connectorId) {
      if (state.statistic.plugs.plugState[connectorId] === PlugStateEnum.UNPLUGGED) {
        state.switch.plugs.startTransaction[connectorId] = true;
        state.switch.plugs.stopTransaction[connectorId] = true;
        state.switch.plugs.sendAuth[connectorId] = true;
        state.switch.plugs.chargeStart[connectorId] = true;
        state.state.plugs.transactionId[connectorId] = 0;

        if (state.switch.plugs.sendStatusNotification[connectorId]) {
          state.switch.plugs.sendStatusNotification[connectorId] = false;
          ping.StatusNotification.execute(
            connectorId,
            ping.StatusNotification.enums.StatusEnum.Available,
            ping.StatusNotification.enums.ErrorCodeEnum.NoError
          );
        }
      } else {
        state.switch.plugs.sendStatusNotification[connectorId] = true;
      }

      if (
        state.statistic.plugs.plugState[connectorId] === PlugStateEnum.PLUG_SOFT_LOCK &&
        !state.switch.plugs.softLock[connectorId]
      ) {
        state.switch.plugs.softLock[connectorId] = true;
        await ping.ChangeAvailability.execute(connectorId, ping.ChangeAvailability.enums.StatusEnum.Accepted);
      }

      if (
        state.statistic.plugs.plugState[connectorId] === PlugStateEnum.CAR_DETECTED &&
        state.switch.plugs.sendAuth[connectorId]
      ) {
        state.switch.plugs.sendAuth[connectorId] = false;
        // await ping.Authorize.execute(connectorId, state.state.plugs.idTags[connectorId]);

        ping.StatusNotification.execute(
          connectorId,
          ping.StatusNotification.enums.StatusEnum.Preparing,
          ping.StatusNotification.enums.ErrorCodeEnum.NoError
        );
      }

      if (
        state.state.plugs.idTagInfoStatus[connectorId] === 'Accepted' &&
        state.switch.plugs.startTransaction[connectorId]
      ) {
        state.state.plugs.idTagInfoStatus[connectorId] = '';
        state.switch.plugs.startTransaction[connectorId] = false;

        await ping.StartTransaction.execute(connectorId);

        ping.StatusNotification.execute(
          connectorId,
          ping.StatusNotification.enums.StatusEnum.Charging,
          ping.StatusNotification.enums.ErrorCodeEnum.NoError
        );
      }

      if (
        state.state.plugs.startTransactionStatus[connectorId] === 'Accepted' &&
        state.switch.plugs.chargeStart[connectorId]
      ) {
        state.state.plugs.startTransactionStatus[connectorId] = '';
        state.switch.plugs.chargeStart[connectorId] = false;

        ComPort.emit('PROXIRE1:');
      }

      if (
        state.statistic.plugs.plugState[connectorId] === PlugStateEnum.CHARGING &&
        state.switch.plugs.chargingPeriodAuth[connectorId]
      ) {
        state.switch.plugs.chargingPeriodAuth[connectorId] = false;
        // await ping.Authorize.execute(connectorId);

        ping.StatusNotification.execute(
          connectorId,
          ping.StatusNotification.enums.StatusEnum.Charging,
          ping.StatusNotification.enums.ErrorCodeEnum.NoError
        );
      }

      if (
        state.statistic.plugs.plugState[connectorId] === PlugStateEnum.CHARGE_COMPLETED &&
        state.switch.plugs.stopTransaction[connectorId]
      ) {
        state.switch.plugs.stopTransaction[connectorId] = false;
        await ping.StopTransaction.execute(connectorId);

        state.state.plugs.idTagInfoStatus[connectorId] = '';

        ping.StatusNotification.execute(
          connectorId,
          ping.StatusNotification.enums.StatusEnum.Available,
          ping.StatusNotification.enums.ErrorCodeEnum.NoError
        );
      }

      if (state.state.plugs.stopTransactionStatus[connectorId] === 'Accepted') {
        state.state.plugs.stopTransactionStatus[connectorId] = '';
        state.state.plugs.idTagInfoStatus[connectorId] = '';

        Logger.info('Charge completed.');

        ping.StatusNotification.execute(
          connectorId,
          ping.StatusNotification.enums.StatusEnum.Available,
          ping.StatusNotification.enums.ErrorCodeEnum.NoError
        );
      }
    }
  }

  WebSocket.register('message', async function (message) {
    if (message.type !== 'utf8') {
      Logger.warning('Not UTF-8 data was received:', message);
      return;
    }

    const parseData = JSON.parse(message.utf8Data);
    Logger.json('WebSocket data received:', parseData);

    const isServerCommand = EventQueue.isServerCommand(parseData[2]);
    Logger.info(isServerCommand ? 'Received server command.' : 'Received non-server command.');

    if (isServerCommand) {
      // state.receiveServerId = parseData[1];
      const serverAskedConnectorId = parseData[3].connectorId;

      switch (parseData[2]) {
        case EventCommandNameEnum[EventCommandEnum.EVENT_RESERVATION]:
          state.state.plugs.reservationId[serverAskedConnectorId] = parseData[3].reservationId;
          state.state.plugs.expiryDate[serverAskedConnectorId] = parseData[3].expiryDate;

          ping.Reservation.execute(connectorId, ping.Reservation.enums.StatusEnum.Accepted);

          ping.StatusNotification.execute(
            connectorId,
            ping.StatusNotification.enums.StatusEnum.Reserved,
            ping.StatusNotification.enums.ErrorCodeEnum.NoError
          );
          break;

        case EventCommandNameEnum[EventCommandEnum.EVENT_CHANGE_AVAILABILITY]:
          if (parseData[3].connectorId > state.maxPlugsCount) {
            ping.ChangeAvailability.execute(connectorId, ping.ChangeAvailability.enums.StatusEnum.Rejected);
          } else {
            if (!['Inoperative', 'Operative'].includes(parseData[3].type)) {
              ping.ChangeAvailability.execute(connectorId, ping.ChangeAvailability.enums.StatusEnum.Rejected);
            } else {
              ping.ChangeAvailability.execute(
                connectorId,
                ping.ChangeAvailability.enums.StatusEnum.Scheduled
              );

              if (parseData[3].type == 'Inoperative') {
                ComPort.emit(`PLUG${parseData[3].connectorId}OFF:`);

                ping.StatusNotification.execute(
                  connectorId,
                  ping.StatusNotification.enums.StatusEnum.Unavailable,
                  ping.StatusNotification.enums.ErrorCodeEnum.NoError
                );
              } else if (parseData[3].type == 'Operative') {
                ComPort.emit(`PLUG${parseData[3].connectorId}ONN:`);

                ping.StatusNotification.execute(
                  connectorId,
                  ping.StatusNotification.enums.StatusEnum.Available,
                  ping.StatusNotification.enums.ErrorCodeEnum.NoError
                );
              }
            }
          }
          break;

        case EventCommandNameEnum[EventCommandEnum.EVENT_REMOTE_TRANSACTION_START]:
          state.state.plugs.idTags[serverAskedConnectorId] = parseData[3].idTag;
          // state.state.plugs.transactionId[serverAskedConnectorId] =
          //   parseData[3].chargingProfile.transactionId;

          ping.RemoteStartTransaction.execute(
            serverAskedConnectorId,
            ping.RemoteStartTransaction.enums.StatusEnum.Accepted
          );
          break;

        // case EventCommandNameEnum[EventCommandEnum.EVENT_REMOTE_TRANSACTION_STOP]:
        //   const currentTransactionId = state.state.plugs.transactionId[serverAskedConnectorId];
        //   state.state.plugs.idTags[serverAskedConnectorId] = '';
        //   state.state.plugs.transactionId[serverAskedConnectorId] = '';

        //   ping.RemoteStopTransaction.execute(serverAskedConnectorId, currentTransactionId);
        //   break;
      }
    } else {
      const previousIds = EventQueue.getPreviousIds();
      if (!previousIds) {
        return;
      }

      const { commandId, connectorId } = previousIds;

      switch (commandId) {
        case EventCommandEnum.EVENT_BOOT_NOTIFICATION:
          const bootNotificationResult = parseData[2];
          state.state.common.bootNotStatus = bootNotificationResult.status;
          state.state.common.bootNotCurrentTime = bootNotificationResult.currentTime;
          state.state.common.bootNotRequireTime = Number(bootNotificationResult.interval);

          await ping.HearthBeat.execute();
          break;

        case EventCommandEnum.EVENT_HEARTH_BEAT:
          break;

        case EventCommandEnum.EVENT_AUTHORIZE:
          const authorizeResult = parseData[2];
          state.state.plugs.idTagInfoStatus[connectorId] =
            (authorizeResult.idTagInfo || {}).status || 'Accepted';
          state.switch.plugs.chargingPeriodAuth[connectorId] = true;
          break;

        case EventCommandEnum.EVENT_TRANSACTION_START:
          const startTransactionResult = parseData[2];
          state.state.plugs.transactionId[connectorId] = startTransactionResult.transactionId;
          state.state.plugs.startTransactionStatus[connectorId] =
            (startTransactionResult.idTagInfo || {}).status || 'Accepted';
          break;

        case EventCommandEnum.EVENT_TRANSACTION_STOP:
          const stopTransactionResult = parseData[2];
          state.state.plugs.stopTransactionStatus[connectorId] =
            (stopTransactionResult.idTagInfo || {}).status || 'Accepted';
          break;
      }

      EventQueue.cleanup();
    }
  });

  comportHandlerId = ComPort.register(onDataReady);

  WebSocket.register('close', function () {
    ComPort.unregister(comportHandlerId);
  });

  ping.BootNotification.execute();
});

WebSocket.startServer();
