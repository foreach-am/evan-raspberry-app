const { DataParser, MessageTypeEnum } = require('./libraries/DataParser');
const { Logger } = require('./libraries/Logger');
const { WebSocket } = require('./libraries/WebSocket');
const { ComPort } = require('./libraries/ComPort');
const { ComEmitter } = require('./libraries/ComEmitter');
const { EventQueue, EventCommandEnum, EventCommandNameEnum } = require('./libraries/EventQueue');
const { PlugStateEnum } = require('./libraries/PlugState');
const { Raspberry } = require('./libraries/Raspberry');
const { CoreEvent, CoreEventEnum } = require('./libraries/CoreEvent');

const uuid = require('./utils/uuid');
const logParsedServerData = require('./helpers/logParsedServerData');
const state = require('./state');
const ping = require('./ping');
const execute = require('./execute');

let comportHandlerId = -1;

setInterval(() => {
  Raspberry.mapOnPlugs(async function (connectorId) {
    if (state.statistic.plugs.plugState[connectorId] !== PlugStateEnum.CHARGING) {
      return;
    }

    await execute.NotifyMeterValues({}, connectorId);
  });
}, 10 * 1000);

ComPort.onLongIdle(async function () {
  Logger.info('ComPort stuck, calling hardware and software reset ...');

  await Raspberry.restartHardware();
  await Raspberry.restartSoftware();
  await ComPort.close();
});

ComPort.onSerialPort('open', function () {
  ComEmitter.masterRead();

  WebSocket.onConnect(async function (connection) {
    async function onDataReady() {
      // if (process.env.NODE_ENV !== 'production') {
      //   logParsedServerData();
      // }

      Raspberry.mapOnPlugs(async function (connectorId) {
        Logger.info(`Plug State [${connectorId}]`, {
          current: state.statistic.plugs.plugState[connectorId],
          previous: state.state.plugs.previousPlugState[connectorId],
        });

        if (
          state.statistic.plugs.plugState[connectorId] === PlugStateEnum.UNPLUGGED &&
          state.statistic.plugs.plugState[connectorId] !== state.state.plugs.previousPlugState[connectorId]
        ) {
          state.state.plugs.previousPlugState[connectorId] = state.statistic.plugs.plugState[connectorId];

          state.switch.plugs.startTransaction[connectorId] = true;
          state.switch.plugs.stopTransaction[connectorId] = true;
          state.switch.plugs.chargeStart[connectorId] = true;
          state.state.plugs.transactionId[connectorId] = '';

          if (state.switch.plugs.sendStatusNotification[connectorId]) {
            state.switch.plugs.sendStatusNotification[connectorId] = false;
            await ping.StatusNotification.execute(
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
          await execute.PingCarDetected({}, connectorId);
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

          await ComEmitter.proxire(connectorId);
        }

        if (
          state.state.plugs.startTransactionStatus[connectorId] === 'Accepted' &&
          state.switch.plugs.chargeStart[connectorId]
        ) {
          state.state.plugs.startTransactionStatus[connectorId] = '';
          state.switch.plugs.chargeStart[connectorId] = false;

          await ComEmitter.proxire(connectorId);
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
          await execute.UpdateFlagStopTransaction({}, connectorId);

          await ping.StatusNotification.execute(
            uuid(),
            connectorId,
            ping.StatusNotification.StatusEnum.FINISHING,
            ping.StatusNotification.ErrorCodeEnum.NO_ERROR
          );
        }

        if (state.state.plugs.stopTransactionStatus[connectorId] === 'Accepted') {
          state.state.plugs.stopTransactionStatus[connectorId] = '';
          state.state.plugs.idTagInfoStatus[connectorId] = '';

          Logger.info('Charge completed.');

          await ping.StatusNotification.execute(
            uuid(),
            connectorId,
            ping.StatusNotification.StatusEnum.AVAILABLE,
            ping.StatusNotification.ErrorCodeEnum.NO_ERROR
          );
        }
      });

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
            // await execute.UpdateFlagStopTransaction(parsedServerData, connectorId);
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
});

setTimeout(function () {
  ComPort.open();

  setTimeout(function () {
    ComEmitter.startRun();
  }, 1000);
}, 100);

CoreEvent.register(CoreEventEnum.EVENT_EXIT, function () {
  ComPort.close();
});
