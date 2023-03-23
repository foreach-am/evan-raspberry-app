const { DataParser, MessageTypeEnum } = require('./libraries/DataParser');
const { Logger } = require('./libraries/Logger');
const { WebSocket } = require('./libraries/WebSocket');
const { ComPort } = require('./libraries/ComPort');
const { ComEmitter } = require('./libraries/ComEmitter');
const {
  EventQueue,
  EventCommandEnum,
  EventCommandNameEnum,
} = require('./libraries/EventQueue');
const { PlugStateEnum } = require('./libraries/PlugState');
const {
  Raspberry,
  RebootSoftwareReasonEnum,
} = require('./libraries/Raspberry');
const {
  LastTime,
  ComState: ComStateManager,
  Reboot: RebootManager,
} = require('./libraries/OfflineManager');
const bootstrap = require('./bootstrap');

const uuid = require('./utils/uuid');
const state = require('./state');
const ping = require('./ping');
const execute = require('./execute');

let timerMasterRead = null;
async function onComportDataReady() {
  const currentState = {};
  Raspberry.mapOnPlugs(function (connectorId) {
    currentState[connectorId] = state.statistic.plugs.plugState[connectorId];
  });
  ComStateManager.set(currentState);

  Raspberry.mapOnPlugs(async function (connectorId) {
    Logger.json(`Plug state ${connectorId}:`, {
      wsConnected: WebSocket.isConnected(),
      state: state.statistic.plugs.plugState[connectorId],
      // softLocked: !!state.state.plugs.softLockDueConnectionLose[connectorId],
      // softLockedValue: state.state.plugs.softLockDueConnectionLose[connectorId],
      plugCurrent: state.statistic.plugs.plugState[connectorId],
      plugPrevious: state.state.plugs.previousPlugState[connectorId],
    });

    if (
      !WebSocket.isConnected() &&
      state.statistic.plugs.plugState[connectorId] === PlugStateEnum.UNPLUGGED
    ) {
      await ComEmitter.plugOff(connectorId);
      state.state.plugs.softLockDueConnectionLose[connectorId] = true;
    }

    if (
      // connected to internet
      WebSocket.isConnected() &&
      // soft-lock state
      state.statistic.plugs.plugState[connectorId] ===
        PlugStateEnum.PLUG_SOFT_LOCK
      // // locked due internet lose, or initial state
      //  && (state.state.plugs.softLockDueConnectionLose[connectorId] ||
      //   typeof state.state.plugs.softLockDueConnectionLose[connectorId] !==
      //     'boolean')
    ) {
      await ComEmitter.plugOn(connectorId);
      state.state.plugs.softLockDueConnectionLose[connectorId] = false;
    }

    if (
      state.statistic.plugs.plugState[connectorId] ===
        PlugStateEnum.UNPLUGGED &&
      state.statistic.plugs.plugState[connectorId] !==
        state.state.plugs.previousPlugState[connectorId]
    ) {
      if (WebSocket.isConnected()) {
        state.state.plugs.softLockDueConnectionLose[connectorId] = false;
      }

      state.state.plugs.previousPlugState[connectorId] =
        state.statistic.plugs.plugState[connectorId];

      state.switch.plugs.startTransaction[connectorId] = true;
      state.switch.plugs.stopTransaction[connectorId] = true;
      state.switch.plugs.chargeStart[connectorId] = true;
      state.state.plugs.transactionId[connectorId] = '';
      // state.saveState();

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
      state.statistic.plugs.plugState[connectorId] === PlugStateEnum.CHARGING &&
      state.state.plugs.transactionId[connectorId] === '' &&
      state.state.plugs.idTags[connectorId] === ''
    ) {
      state.loadSavedState();
    }

    if (
      state.statistic.plugs.plugState[connectorId] ===
        PlugStateEnum.PLUG_SOFT_LOCK &&
      state.statistic.plugs.plugState[connectorId] !==
        state.state.plugs.previousPlugState[connectorId]
    ) {
      state.state.plugs.previousPlugState[connectorId] =
        state.statistic.plugs.plugState[connectorId];

      await ping.ChangeAvailability.execute(
        uuid(),
        connectorId,
        ping.ChangeAvailability.StatusEnum.ACCEPTED
      );
    }

    if (
      state.statistic.plugs.plugState[connectorId] ===
        PlugStateEnum.CAR_DETECTED &&
      state.statistic.plugs.plugState[connectorId] !==
        state.state.plugs.previousPlugState[connectorId]
    ) {
      state.state.plugs.previousPlugState[connectorId] =
        state.statistic.plugs.plugState[connectorId];
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
      state.statistic.plugs.plugState[connectorId] !==
        state.state.plugs.previousPlugState[connectorId]
    ) {
      state.state.plugs.previousPlugState[connectorId] =
        state.statistic.plugs.plugState[connectorId];
      await execute.PingAndStartTransaction(connectorId);
    }

    if (
      state.statistic.plugs.plugState[connectorId] ===
        PlugStateEnum.CHARGE_COMPLETED &&
      state.statistic.plugs.plugState[connectorId] !==
        state.state.plugs.previousPlugState[connectorId]
    ) {
      state.state.plugs.previousPlugState[connectorId] =
        state.statistic.plugs.plugState[connectorId];
      await execute.UpdateFlagStopTransaction(
        {},
        connectorId,
        ping.StopTransaction.ReasonEnum.Local
      );

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

  clearTimeout(timerMasterRead);
  timerMasterRead = setTimeout(function () {
    ComEmitter.masterRead();
  }, 2_000);
}

async function onWsMessage(message) {
  if (message.type !== 'utf8' && message.type !== 'utf-8') {
    Logger.warning('Non UTF-8 data was received:', message);
    return;
  }

  const parsedServerData = DataParser.parse(message.utf8Data);

  const isServerCommand =
    parsedServerData.messageType === MessageTypeEnum.TYPE_REQUEST;
  if (isServerCommand) {
    switch (parsedServerData.command) {
      case EventCommandNameEnum[EventCommandEnum.EVENT_RESERVE_NOW]:
        await execute.PingReserveNow(parsedServerData);
        break;

      case EventCommandNameEnum[EventCommandEnum.EVENT_CHANGE_AVAILABILITY]:
        await execute.ChangeConnectorAvailability(parsedServerData);
        break;

      case EventCommandNameEnum[EventCommandEnum.EVENT_CHANGE_CONFIGURATION]:
        await execute.ChangeStationConfiguration(parsedServerData);
        break;

      case EventCommandNameEnum[
        EventCommandEnum.EVENT_REMOTE_START_TRANSACTION
      ]:
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
        await execute.BootNotification(parsedServerData, function () {
          bootstrap.registerMeterValueInterval(
            state.state.common.bootNotRequireTime
          );
        });
        break;

      case EventCommandEnum.EVENT_HEARTBEAT:
        await execute.Heartbeat(parsedServerData);
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
}

ComPort.register(function () {
  setTimeout(function () {
    onComportDataReady();
  }, 1500);
});

const initialState = (() => {
  try {
    state.loadSavedState();
    return JSON.parse(JSON.stringify(state.state.plugs.transactionId));
  } catch (e) {
    return {};
  }
})();

const initialComState = ComStateManager.get();

async function changeTransactionInCaseOfPowerReset(lastTimeSaved, waitForNetwork = 0) {
  if (lastTimeSaved) {
    const nowString = new Date().toISOString();

    const last = new Date(lastTimeSaved).getTime() + waitForNetwork;
    const now = new Date(nowString).getTime();
    const diff = now - last;

    Logger.info(`Checking last transaction delay: ${diff}`, {
      nowString,
      lastTimeSaved,
      now,
      last,
    });

    // don't close any transaction if previous action is less then 10 seconds.
    if (diff < 15 * 1000) {
      return;
    }
  }

  for (const connectorId in state.state.plugs.transactionId) {
    const lastTransactionId = state.state.plugs.transactionId[connectorId];
    if (!lastTransactionId) {
      continue;
    }

    // state.statistic.plugs.plugState[connectorId] === PlugStateEnum.PLUG_SOFT_LOCK
    if (
      lastTimeSaved &&
      initialComState[connectorId] === PlugStateEnum.CHARGING &&
      initialState[connectorId] === lastTransactionId
    ) {
      const nowString = new Date().toISOString();

      const last = new Date(lastTimeSaved).getTime() + waitForNetwork;
      const now = new Date(nowString).getTime();
      const diff = now - last;

      if (diff <= 10 * 60 * 1000) {
        await ComEmitter.plugReset(connectorId);
        setTimeout(async () => {
          await ComEmitter.proxire(connectorId);
        }, 1000);

        return;
      }
    }

    state.state.plugs.previousPlugState[connectorId] =
      state.statistic.plugs.plugState[connectorId];

    await ComEmitter.plugStop(connectorId);

    await execute.UpdateFlagStopTransaction(
      {},
      connectorId,
      ping.StopTransaction.ReasonEnum.Reboot,
      new Date(lastTimeSaved).toISOString()
    );
  }
}

function registerLastTimeInterval() {
  LastTime.register(2);
}

const rebootReason = RebootManager.getReason();
let bootNotificationAlreadySent = false;

async function sendBootNotification() {
  if (bootNotificationAlreadySent) {
    return;
  }

  await ping.BootNotification.execute(uuid());
  bootNotificationAlreadySent = true;
}

const lastTimeSaved = LastTime.getLastTime();
let waitForNetwork = 0;
let intervalNetwork = setInterval(function () {
  ++waitForNetwork;
}, 1000);

async function onWsConnect() {
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ', {
    lastTimeSaved,
    initialComState,
    initialState,
    rebootReason,
  });

  if (
    rebootReason !== RebootSoftwareReasonEnum.COMPORT_STUCK &&
    rebootReason !== RebootSoftwareReasonEnum.BY_OCPP_PROTOCOL
  ) {
    await changeTransactionInCaseOfPowerReset(lastTimeSaved, waitForNetwork * 1000);
    await sendBootNotification();
  }

  registerLastTimeInterval();
}

bootstrap.onComportOpen(rebootReason, async function () {
  bootstrap.registerWebsocketEvents({
    onConnect: onWsConnect,
    onMessage: onWsMessage,
  });

  WebSocket.startServer();
});
