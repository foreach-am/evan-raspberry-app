const { DataParser, MessageTypeEnum } = require('./libraries/DataParser');
const { Logger } = require('./libraries/Logger');
const { WebSocket } = require('./libraries/WebSocket');
const { ComPort, Emitter } = require('./libraries/ComPort');
const { EventQueue, EventCommandEnum, EventCommandNameEnum } = require('./libraries/EventQueue');
const { PlugStateEnum } = require('./libraries/PlugState');

const uuid = require('./utils/uuid');

const state = require('./state');
const ping = require('./ping');
const execute = require('./execute');

let comportHandlerId = -1;

function logparsedSocketData() {
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

  Logger.divider();
  Logger.json('Device measurement data is ready:', logResult);
}

WebSocket.onConnect(async function (connection) {
  async function onDataReady() {
    if (process.env.NODE_ENV !== 'production') {
      logparsedSocketData();
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
        // await ping.Authorize.execute(uuid(), connectorId, state.state.plugs.idTags[connectorId]);

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

        Emitter.proxier(connectorId);
      }

      if (
        state.statistic.plugs.plugState[connectorId] === PlugStateEnum.CHARGING &&
        state.switch.plugs.chargingPeriodAuth[connectorId]
      ) {
        state.switch.plugs.chargingPeriodAuth[connectorId] = false;
        // await ping.Authorize.execute(uuid(), connectorId, state.state.plugs.idTags[connectorId]);

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

    const parsedSocketData = DataParser.parse(message.utf8Data);

    const isServerCommand = parsedSocketData.messageType === MessageTypeEnum.TYPE_REQUEST;
    if (isServerCommand) {
      switch (parsedSocketData.command) {
        case EventCommandNameEnum[EventCommandEnum.EVENT_RESERVE_NOW]:
          await execute.PingReserveNow(parsedSocketData);
          break;

        case EventCommandNameEnum[EventCommandEnum.EVENT_CHANGE_AVAILABILITY]:
          await execute.ChangeConnectorAvailability(parsedSocketData);
          break;

        case EventCommandNameEnum[EventCommandEnum.EVENT_REMOTE_START_TRANSACTION]:
          await execute.PingAndRemoteStartTransaction(parsedSocketData);
          break;

        case EventCommandNameEnum[EventCommandEnum.EVENT_REMOTE_STOP_TRANSACTION]:
          await execute.PingAndRemoteStopTransaction(parsedSocketData);
          break;

        case EventCommandNameEnum[EventCommandEnum.EVENT_RESET]:
          await execute.PingAndReset(parsedSocketData);
          break;
      }
    } else {
      const foundMessage = EventQueue.getByMessageId(parsedSocketData.messageId);
      if (!foundMessage) {
        return;
      }

      const { commandId, connectorId, messageId } = foundMessage;

      switch (commandId) {
        case EventCommandEnum.EVENT_BOOT_NOTIFICATION:
          await execute.BootNotification(parsedSocketData);
          break;

        case EventCommandEnum.EVENT_HEARTH_BEAT:
          await execute.HearthBeat(parsedSocketData);
          break;

        case EventCommandEnum.EVENT_AUTHORIZE:
          await execute.UpdateFlagAuthorize(parsedSocketData, connectorId);
          break;

        case EventCommandEnum.EVENT_TRANSACTION_START:
          await execute.UpdateFlagStartTransaction(parsedSocketData, connectorId);
          break;

        case EventCommandEnum.EVENT_TRANSACTION_STOP:
          await execute.UpdateFlagStopTransaction(parsedSocketData, connectorId);
          break;
      }

      EventQueue.makeFinished(messageId);
    }
  });

  comportHandlerId = ComPort.register(onDataReady);

  WebSocket.register('close', function () {
    ComPort.unregister(comportHandlerId);
  });

  ping.BootNotification.execute(uuid());
});

WebSocket.startServer();
