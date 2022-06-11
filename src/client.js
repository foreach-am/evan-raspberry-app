const { Logger } = require('./libraries/Logger');
const { WebSocket } = require('./libraries/WebSocket');
const { ComPort } = require('./libraries/ComPort');
const { EventQueue, EventCommandEnum, EventCommandNameEnum } = require('./libraries/EventQueue');
const { PlugStateEnum } = require('./libraries/PlugState');
// const { Raspberry } = require('./libraries/Raspberry');

const uuid = require('./utils/uuid');

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

  // append(` DEVICE LOG`, '----------------------------------------', '-');
  // append('Device Temperature', `${temperature} C`);
  // append('HighVoltError', `${highVoltError} State`);
  // append('LowVoltError', `${lowVoltError} State`);
  // append('HighVoltageMeasure', `${highVoltageMeasure} V.AC`);

  for (let i = 1; i <= state.maxPlugsCount; ++i) {
    append(` PLUG LOG [${i}]`, '----------------------------------------', '-');
    append(`PlugState[${i}]`, `${plugState[i]} State`);
    // append(`PowerKwH[${i}]`, `${powerKwh[i]} KW/h`);
    // append(`FeedBackVolt[${i}]`, `${pilotFeedBack[i]} V`);
    // append(`CurrentMeasureA[${i}]`, `${currentMeasureA[i]} A`);
    // append(`CurrentMeasureB[${i}]`, `${currentMeasureB[i]} A`);
    // append(`CurrentMeasureC[${i}]`, `${currentMeasureC[i]} A`);
    // append(`OverCurrentError[${i}]`, `${overCurrentError[i]} State`);
  }

  Logger.divider();
  Logger.json('Device measurement data is ready:', logResult);
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
            uuid(),
            connectorId,
            ping.StatusNotification.StatusEnum.AVAILABLE,
            ping.StatusNotification.ErrorCodeEnum.NO_ERROR
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
        await ping.ChangeAvailability.execute(
          uuid(),
          connectorId,
          ping.ChangeAvailability.StatusEnum.ACCEPTED
        );
      }

      if (
        state.statistic.plugs.plugState[connectorId] === PlugStateEnum.CAR_DETECTED &&
        state.switch.plugs.sendAuth[connectorId]
      ) {
        state.switch.plugs.sendAuth[connectorId] = false;
        await ping.Authorize.execute(uuid(), connectorId, state.state.plugs.idTags[connectorId]);

        ping.StatusNotification.execute(
          uuid(),
          connectorId,
          ping.StatusNotification.StatusEnum.PREPARING,
          ping.StatusNotification.ErrorCodeEnum.NO_ERROR
        );
      }

      if (
        state.state.plugs.idTagInfoStatus[connectorId] === 'Accepted' &&
        state.switch.plugs.startTransaction[connectorId]
      ) {
        state.state.plugs.idTagInfoStatus[connectorId] = '';
        state.switch.plugs.startTransaction[connectorId] = false;

        await ping.StartTransaction.execute(uuid(), connectorId);

        ping.StatusNotification.execute(
          uuid(),
          connectorId,
          ping.StatusNotification.StatusEnum.CHARGING,
          ping.StatusNotification.ErrorCodeEnum.NO_ERROR
        );
      }

      if (
        state.state.plugs.startTransactionStatus[connectorId] === 'Accepted' &&
        state.switch.plugs.chargeStart[connectorId]
      ) {
        state.state.plugs.startTransactionStatus[connectorId] = '';
        state.switch.plugs.chargeStart[connectorId] = false;

        ComPort.emit(`PROXIRE${connectorId}:`);
      }

      if (
        state.statistic.plugs.plugState[connectorId] === PlugStateEnum.CHARGING &&
        state.switch.plugs.chargingPeriodAuth[connectorId]
      ) {
        state.switch.plugs.chargingPeriodAuth[connectorId] = false;
        await ping.Authorize.execute(uuid(), connectorId, state.state.plugs.idTags[connectorId]);

        // ping.StatusNotification.execute(
        //   uuid(),
        //   connectorId,
        //   ping.StatusNotification.StatusEnum.CHARGING,
        //   ping.StatusNotification.ErrorCodeEnum.NO_ERROR
        // );
      }

      if (
        state.statistic.plugs.plugState[connectorId] === PlugStateEnum.CHARGE_COMPLETED &&
        state.switch.plugs.stopTransaction[connectorId]
      ) {
        state.switch.plugs.stopTransaction[connectorId] = false;
        await ping.StopTransaction.execute(uuid(), connectorId);

        state.state.plugs.idTagInfoStatus[connectorId] = '';

        ping.StatusNotification.execute(
          uuid(),
          connectorId,
          ping.StatusNotification.StatusEnum.AVAILABLE,
          ping.StatusNotification.ErrorCodeEnum.NO_ERROR
        );
      }

      if (state.state.plugs.stopTransactionStatus[connectorId] === 'Accepted') {
        state.state.plugs.stopTransactionStatus[connectorId] = '';
        state.state.plugs.idTagInfoStatus[connectorId] = '';

        Logger.info('Charge completed.');

        ping.StatusNotification.execute(
          uuid(),
          connectorId,
          ping.StatusNotification.StatusEnum.AVAILABLE,
          ping.StatusNotification.ErrorCodeEnum.NO_ERROR
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

    const receivedMessageId = parseData[1];
    const isServerCommand = EventQueue.isServerCommand(parseData[2]);

    if (isServerCommand) {
      // state.receiveServerId = parseData[1];
      const serverAskedConnectorId = parseData[3].connectorId;
      const serverAskedTransactionId = parseData[3].transactionId;

      switch (parseData[2]) {
        case EventCommandNameEnum[EventCommandEnum.EVENT_RESERVATION]:
          state.state.plugs.reservationId[serverAskedConnectorId] = parseData[3].reservationId;
          state.state.plugs.expiryDate[serverAskedConnectorId] = parseData[3].expiryDate;

          ping.Reservation.execute(receivedMessageId, connectorId, ping.Reservation.StatusEnum.ACCEPTED);

          ping.StatusNotification.execute(
            uuid(),
            connectorId,
            ping.StatusNotification.StatusEnum.RESERVED,
            ping.StatusNotification.ErrorCodeEnum.NO_ERROR
          );
          break;

        case EventCommandNameEnum[EventCommandEnum.EVENT_CHANGE_AVAILABILITY]:
          if (parseData[3].connectorId > state.maxPlugsCount) {
            ping.ChangeAvailability.execute(
              receivedMessageId,
              connectorId,
              ping.ChangeAvailability.StatusEnum.REJECTED
            );
          } else {
            const possibleStates = Object.values(ping.ChangeAvailability.PointStateEnum);
            if (!possibleStates.includes(parseData[3].type)) {
              ping.ChangeAvailability.execute(
                receivedMessageId,
                connectorId,
                ping.ChangeAvailability.StatusEnum.REJECTED
              );
            } else {
              ping.ChangeAvailability.execute(
                receivedMessageId,
                connectorId,
                ping.ChangeAvailability.StatusEnum.SCHEDULED
              );

              if (parseData[3].type == ping.ChangeAvailability.PointStateEnum.INOPERATIVE) {
                ComPort.emit(`PLUG${parseData[3].connectorId}OFF:`);

                ping.StatusNotification.execute(
                  uuid(),
                  connectorId,
                  ping.StatusNotification.StatusEnum.UNAVAILABLE,
                  ping.StatusNotification.ErrorCodeEnum.NO_ERROR
                );
              } else if (parseData[3].type == ping.ChangeAvailability.PointStateEnum.OPERATIVE) {
                ComPort.emit(`PLUG${parseData[3].connectorId}ONN:`);

                ping.StatusNotification.execute(
                  uuid(),
                  connectorId,
                  ping.StatusNotification.StatusEnum.AVAILABLE,
                  ping.StatusNotification.ErrorCodeEnum.NO_ERROR
                );
              }
            }
          }
          break;

        case EventCommandNameEnum[EventCommandEnum.EVENT_REMOTE_START_TRANSACTION]:
          state.state.plugs.idTags[serverAskedConnectorId] = parseData[3].idTag;
          // state.state.plugs.transactionId[serverAskedConnectorId] =
          //   parseData[3].chargingProfile.transactionId;

          ping.RemoteStartTransaction.execute(
            receivedMessageId,
            serverAskedConnectorId,
            ping.RemoteStartTransaction.StatusEnum.ACCEPTED
          );

          await ping.StartTransaction.execute(uuid(), serverAskedConnectorId);

          ping.StatusNotification.execute(
            serverAskedConnectorId,
            ping.StatusNotification.StatusEnum.CHARGING,
            ping.StatusNotification.ErrorCodeEnum.NO_ERROR
          );

          ComPort.emit(`PROXIRE${serverAskedConnectorId}:`);
          break;

        case EventCommandNameEnum[EventCommandEnum.EVENT_REMOTE_STOP_TRANSACTION]:
          const stopConnectorId = Object.keys(state.state.plugs.transactionId).find((itemConnectorId) => {
            return state.state.plugs.transactionId[itemConnectorId] === serverAskedTransactionId;
          });

          if (stopConnectorId) {
            await ping.RemoteStopTransaction.execute(
              receivedMessageId,
              serverAskedConnectorId,
              serverAskedTransactionId
            );
            ComPort.emit(`PLUG${stopConnectorId}STOP:`);
          }
          break;
      }
    } else {
      // const foundMessage = EventQueue.getPreviousIds();
      const foundMessage = EventQueue.getByMessageId(receivedMessageId);
      if (!foundMessage) {
        return;
      }

      const { commandId, connectorId } = foundMessage;

      switch (commandId) {
        case EventCommandEnum.EVENT_BOOT_NOTIFICATION:
          const bootNotificationResult = parseData[2];
          state.state.common.bootNotStatus = bootNotificationResult.status;
          state.state.common.bootNotCurrentTime = bootNotificationResult.currentTime;
          state.state.common.bootNotRequireTime = Number(bootNotificationResult.interval);

          await ping.HearthBeat.execute(uuid());
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

  ping.BootNotification.execute(uuid());
});

WebSocket.startServer();
