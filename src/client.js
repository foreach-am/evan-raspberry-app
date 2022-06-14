const { DataParser, MessageTypeEnum } = require('./libraries/DataParser');
const { Logger } = require('./libraries/Logger');
const { WebSocket } = require('./libraries/WebSocket');
const { ComPort } = require('./libraries/ComPort');
const { ComEmitter } = require('./libraries/ComEmitter');
const { EventQueue, EventCommandEnum, EventCommandNameEnum } = require('./libraries/EventQueue');
const { PlugStateEnum } = require('./libraries/PlugState');

const uuid = require('./utils/uuid');
const logParsedServerData = require('./helpers/logParsedServerData');
const state = require('./state');
const ping = require('./ping');
const execute = require('./execute');

let comportHandlerId = -1;

ComEmitter.startRun();
ComPort.onSerialPort('open', function () {
  ComEmitter.masterRead();
});

setTimeout(function () {
  ComPort.open();
}, 1000);

WebSocket.onConnect(async function (connection) {
  async function onDataReady() {
    // if (process.env.NODE_ENV !== 'production') {
    //   logParsedServerData();
    // }

    //connection.emit(data);
    for (let connectorId = 1; connectorId <= state.maxPlugsCount; ++connectorId) {
      if (
        state.statistic.plugs.plugState[connectorId] === PlugStateEnum.UNPLUGGED &&
        state.statistic.plugs.plugState[connectorId] !== state.state.plugs.previousPlugState[connectorId]
      ) {
        state.state.plugs.previousPlugState[connectorId] = state.statistic.plugs.plugState[connectorId];

        state.switch.plugs.startTransaction[connectorId] = true;
        state.switch.plugs.stopTransaction[connectorId] = true;
        state.switch.plugs.sendAuth[connectorId] = true;
        state.switch.plugs.chargeStart[connectorId] = true;
        state.state.plugs.transactionId[connectorId] = '';

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
        state.statistic.plugs.plugState[connectorId] !== state.state.plugs.previousPlugState[connectorId]
      ) {
        state.state.plugs.previousPlugState[connectorId] = state.statistic.plugs.plugState[connectorId];

        await ping.ChangeAvailability.execute(
          uuid(),
          connectorId,
          ping.ChangeAvailability.StatusEnum.ACCEPTED
        );
      }

      if (
        state.statistic.plugs.plugState[connectorId] === PlugStateEnum.CAR_DETECTED &&
        state.statistic.plugs.plugState[connectorId] !== state.state.plugs.previousPlugState[connectorId]
      ) {
        state.state.plugs.previousPlugState[connectorId] = state.statistic.plugs.plugState[connectorId];

        state.switch.plugs.sendAuth[connectorId] = false;
        // await ping.Authorize.execute(uuid(), connectorId, state.state.plugs.idTags[connectorId]);
      }

      if (
        state.state.plugs.idTagInfoStatus[connectorId] === 'Accepted' &&
        state.switch.plugs.startTransaction[connectorId]
      ) {
        state.state.plugs.idTagInfoStatus[connectorId] = '';
        state.switch.plugs.startTransaction[connectorId] = false;

        // await ping.StartTransaction.execute(uuid(), connectorId);

        // ping.StatusNotification.execute(
        //   uuid(),
        //   connectorId,
        //   ping.StatusNotification.StatusEnum.CHARGING,
        //   ping.StatusNotification.ErrorCodeEnum.NO_ERROR
        // );
      }

      if (
        state.state.plugs.startTransactionStatus[connectorId] === 'Accepted' &&
        state.switch.plugs.chargeStart[connectorId]
      ) {
        state.state.plugs.startTransactionStatus[connectorId] = '';
        state.switch.plugs.chargeStart[connectorId] = false;

        ComEmitter.proxire(connectorId);
      }

      if (
        state.statistic.plugs.plugState[connectorId] === PlugStateEnum.CHARGING &&
        state.statistic.plugs.plugState[connectorId] !== state.state.plugs.previousPlugState[connectorId]
      ) {
        state.state.plugs.previousPlugState[connectorId] = state.statistic.plugs.plugState[connectorId];
        await execute.PingAndStartTransaction(connectorId);
      }

      if (
        state.statistic.plugs.plugState[connectorId] === PlugStateEnum.CHARGE_COMPLETED &&
        state.statistic.plugs.plugState[connectorId] !== state.state.plugs.previousPlugState[connectorId]
      ) {
        state.state.plugs.previousPlugState[connectorId] = state.statistic.plugs.plugState[connectorId];
        state.switch.plugs.stopTransaction[connectorId] = false;
        await execute.UpdateFlagStopTransaction({}, connectorId);
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

    setTimeout(function () {
      ComEmitter.masterRead();
    }, 2000);
  }

  WebSocket.register('message', async function (message) {
    if (message.type !== 'utf8') {
      Logger.warning('Non UTF-8 data was received:', message);
      return;
    }

    const parsedServerData = DataParser.parse(message.utf8Data);

    const isServerCommand = parsedServerData.messageType === MessageTypeEnum.TYPE_REQUEST;
    if (isServerCommand) {
      switch (parsedServerData.command) {
        case EventCommandNameEnum[EventCommandEnum.EVENT_RESERVE_NOW]:
          await execute.PingReserveNow(parsedServerData);
          break;

        case EventCommandNameEnum[EventCommandEnum.EVENT_CHANGE_AVAILABILITY]:
          await execute.ChangeConnectorAvailability(parsedServerData);
          break;

        case EventCommandNameEnum[EventCommandEnum.EVENT_REMOTE_START_TRANSACTION]:
          await execute.PingAndRemoteStartTransaction(parsedServerData);
          break;

        case EventCommandNameEnum[EventCommandEnum.EVENT_REMOTE_STOP_TRANSACTION]:
          await execute.PingAndRemoteStopTransaction(parsedServerData);
          break;

        case EventCommandNameEnum[EventCommandEnum.EVENT_RESET]:
          await execute.PingAndReset(parsedServerData);
          break;
      }
    } else {
      const foundMessage = EventQueue.getByMessageId(parsedServerData.messageId);
      if (!foundMessage) {
        return;
      }

      const { commandId, connectorId, messageId } = foundMessage;

      switch (commandId) {
        case EventCommandEnum.EVENT_BOOT_NOTIFICATION:
          await execute.BootNotification(parsedServerData);
          break;

        case EventCommandEnum.EVENT_HEARTH_BEAT:
          await execute.HearthBeat(parsedServerData);
          break;

        case EventCommandEnum.EVENT_AUTHORIZE:
          await execute.UpdateFlagAuthorize(parsedServerData, connectorId);
          break;

        case EventCommandEnum.EVENT_START_TRANSACTION:
          await execute.UpdateFlagStartTransaction(parsedServerData, connectorId);
          break;

        case EventCommandEnum.EVENT_STOP_TRANSACTION:
          await execute.UpdateFlagStopTransaction(parsedServerData, connectorId);
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
