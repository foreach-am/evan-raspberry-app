const { Logger } = require('./libraries/Logger');
const { WebSocket } = require('./libraries/WebSocket');
const { ComPort } = require('./libraries/ComPort');
const { EventQueue, EventCommandEnum } = require('./libraries/EventQueue');
const { PlugStateEnum } = require('./libraries/PlugState');
// const { Raspberry } = require('./libraries/Raspberry');

const state = require('./state');
const ping = require('./ping');

let comportHandlerId = -1;

WebSocket.onConnect(async function (connection) {
  async function onDataReady(data) {
    //connection.emit(data);

    Logger.json('Received data is ready:', {
      '     FeedBackVoltA': `${data.pilotFeedBackA} V`,
      '     FeedBackVoltB': `${data.pilotFeedBackB} V`,
      '   CurrentMeasureA': `${data.currentMeasureA} A`,
      '   CurrentMeasureB': `${data.currentMeasureB} A`,
      '   CurrentMeasureC': `${data.currentMeasureC} A`,
      '   CurrentMeasureD': `${data.currentMeasureD} A`,
      '        PlugState1': `${data.plugState1} State`,
      '        PlugState2': `${data.plugState2} State`,
      '     HighVoltError': `${data.highVoltError} State`,
      '      LowVoltError': `${data.lowVoltError} State`,
      '         Power1Kwh': `${data.pow1Kwh} KW/h`,
      '         Power2Kwh': `${data.pow2Kwh} KW/h`,
      ' OverCurrent1Error': `${data.overCurrent1Error} State`,
      ' OverCurrent2Error': `${data.overCurrent2Error} State`,
      'HighVoltageMeasure': `${data.highVoltageMeasure} V.AC`,
      '       Temperature': `${data.temperature} C`,
    });

    if (data.plugState1 === PlugStateEnum.UNPLUGGED) {
      state.startTransactionSwitch = true;
      state.stopTransactionSwitch = true;
      state.sendAuthSwitch = true;
      state.chargeStartSwitch = true;
      state.transactionId = 0;
    }

    if (
      data.plugState1 === PlugStateEnum.CAR_DETECTED &&
      state.sendAuthSwitch
    ) {
      state.sendAuthSwitch = false;
      await ping.sendAuthorize();
    }

    if (state.idTagInfoStatus === 'Accepted' && state.startTransactionSwitch) {
      state.idTagInfoStatus = '';
      state.startTransactionSwitch = false;
      await ping.sendStartTransaction();
    }

    if (
      state.startTransactionStatus === 'Accepted' &&
      state.chargeStartSwitch
    ) {
      state.startTransactionStatus = '';
      state.chargeStartSwitch = false;
      ComPort.emit('PROXIRE1:');
    }

    if (
      data.plugState1 === PlugStateEnum.CHARGING &&
      state.chargingPeriodAuthSwitch
    ) {
      state.chargingPeriodAuthSwitch = false;
      await ping.sendAuthorize();
    }

    if (
      data.plugState1 === PlugStateEnum.CHARGE_COMPLETED &&
      state.stopTransactionSwitch
    ) {
      state.stopTransactionSwitch = false;
      await ping.sendStopTransaction();
      state.idTagInfoStatus = '';
    }

    if (state.stopTransactionStatus === 'Accepted') {
      state.stopTransactionStatus = '';
      state.idTagInfoStatus = '';

      Logger.interval('Charge completed.');
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

        if (state.receiveCommand === 'ReserveNow') {
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
        }
        break;
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
