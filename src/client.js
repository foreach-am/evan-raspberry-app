const { Logger } = require('./libs/Logger');
const { WebSocket } = require('./libs/WebSocket');
const { ComPort } = require('./libs/ComPort');
const { EventQueue, EventQueueEnum } = require('./libs/EventQueue');

const ping = require('./ping');

let comportHandlerId = -1;

// setInterval(function () {
//   EventQueue.print();
// }, 200);

let sendAuthSwitch = true;
let startTransactionSwitch = true;
let stopTransactionSwitch = true;
let chargeStartSwitch = true;
let chargingPeriodAuthSwitch = true;

//========================BootNotification Variables==============================================
let bootNotStatus = '';
let bootNotCurrentTime = '';
let bootNotRequireTime = 1000;
let idTagInfoStatus = '';
let transactionId = '';
let startTransactionStatus = '';
let stopttransactionstatus = '';
let reciveCommand = '';
let connectorId = '';
let reservationId = '';
let expiryDateConnector1 = '';
let expiryDateConnector2 = '';
let reciveserverId = '';

WebSocket.onConnect(async function (connection) {
  async function onDataReady(data) {
    //connection.emit(data);

    console.log(
      '(FeedBackVoltA: ' +
        data.pilotFeedBackA +
        ' V)' +
        '(FeedBackVoltB: ' +
        data.pilotFeedBackB +
        ' V)'
    ); //Print FeedBack Voltage To Console
    console.log(
      '(currentMeasureA: ' +
        data.currentMeasureA +
        ' A)' +
        '(currentMeasureB: ' +
        data.currentMeasureB +
        ' A)'
    ); //Print FeedBack Voltage To Console
    console.log(
      '(currentMeasureC: ' +
        data.currentMeasureC +
        ' A)' +
        '(currentMeasureD: ' +
        data.currentMeasureD +
        ' A)'
    ); //Print FeedBack Voltage To Console
    console.log(
      '(plugState1: ' +
        data.plugState1 +
        ' State)' +
        '(plugState2: ' +
        data.plugState2 +
        ' State)'
    ); //Print FeedBack Voltage To Console
    console.log(
      '(highVoltError: ' +
        data.highVoltError +
        ' State)' +
        '(lowVoltError: ' +
        data.lowVoltError +
        ' State)'
    ); //Print FeedBack Voltage To Console
    console.log(
      '(pow1Kwh: ' +
        data.pow1Kwh +
        ' KW/h)' +
        '(pow2Kwh: ' +
        data.pow2Kwh +
        ' KW/h)'
    ); //Print FeedBack Voltage To Console
    console.log(
      '(overCurrent1Error: ' +
        data.overCurrent1Error +
        ' State)' +
        '(overCurrent2Error: ' +
        data.overCurrent2Error +
        ' State'
    ); //Print FeedBack Voltage To Console
    console.log(
      '(highVoltageMeasure: ' +
        data.highVoltageMeasure +
        ' V.AC)' +
        '(temperature: ' +
        data.temperature +
        ' ^C)'
    ); //Print FeedBack Voltage To Console
    console.log('(counter: ' + data.counter + ')');

    //=============================Plug 1 State Tasks==============================================
    //console.log('>>>', data.plugState1);
    if (data.plugState1 === 1) {
      startTransactionSwitch = true;
      stopTransactionSwitch = true;
      sendAuthSwitch = true;
      chargeStartSwitch = true;
      transactionId = 0;
    }

    if (data.plugState1 === 2 && sendAuthSwitch) {
      sendAuthSwitch = false;
      await ping.sendAuthorize();
    }

    if (idTagInfoStatus === 'Accepted' && startTransactionSwitch) {
      idTagInfoStatus = '';
      startTransactionSwitch = false;
      await ping.sendStartTransaction();
    }

    if (startTransactionStatus === 'Accepted' && chargeStartSwitch) {
      startTransactionStatus = '';
      chargeStartSwitch = false;
      ComPort.emit('PROXIRE1:');
    }

    if (data.plugState1 === 3 && chargingPeriodAuthSwitch) {
      chargingPeriodAuthSwitch = false;
      await ping.sendAuthorize();
    }

    if (data.plugState1 === 9 && stopTransactionSwitch) {
      stopTransactionSwitch = false;
      await ping.sendStopTransaction();
      idTagInfoStatus = '';
    }
    if (stopttransactionstatus === 'Accepted') {
      stopttransactionstatus = '';
      console.log('Charge Complate');
      idTagInfoStatus = '';
    }
    //=============================================================================================
  }

  WebSocket.register('message', async function (message) {
    if (message.type !== 'utf8') {
      return;
    }

    const commandId = EventQueue.getPreviousCommandId();
    const parseData = JSON.parse(message.utf8Data);

    console.log('Received: ' + message.utf8Data, commandId, parseData);
    switch (commandId) {
      case EventQueueEnum.EVENT_BOOT_NOTIFICATION: //BootNotification
        var bootNotificationResult = parseData[2];
        bootNotStatus = A.status;
        bootNotCurrentTime = A.currentTime;
        bootNotRequireTime = Number(A.interval);
        // console.log('BootNotStatus is ' + bootNotStatus);
        // console.log('BootNotCurrentTime is ' + bootNotCurrentTime);
        // console.log('BootNotRequireTime is ' + bootNotRequireTime);

        await ping.sendHearthBeat(bootNotificationResult, {
          connection,
          transactionId,
        });
        break;

      case EventQueueEnum.EVENT_HEARTHBEAT: //HeartBeat Response
        // comandId = 0;
        break;
      case EventQueueEnum.EVENT_AUTHORIZE: //Authorize Response
        var B = parseData[2];
        idTagInfoStatus = B.idTagInfo.status;
        // console.log('idTagInfoStatus = ' + idTagInfoStatus);
        chargingPeriodAuthSwitch = true;
        // comandId = 0;
        break;
      case EventQueueEnum.EVENT_TRANSACTION_START: //StartTransaction Response
        var C = parseData[2];
        transactionId = C.transactionId;
        startTransactionStatus = C.idTagInfo.status;
        console.log('transactionId = ' + transactionId);
        // console.log('startTransactionStatus = ' + startTransactionStatus);
        // comandId = 0;
        break;
      case EventQueueEnum.EVENT_TRANSACTION_STOP: //StoptTransaction Response
        var D = parseData[2];
        stopttransactionstatus = D.idTagInfo.status;
        // console.log('stopttransactionstatus = ' + stopttransactionstatus);
        // comandId = 0;
        break;
      default:
        reciveCommand = parseData[2];

        if (reciveCommand === 'ReserveNow') {
          reciveserverId = parseData[1];
          connectorId = parseData[3].connectorId;
          if (connectorId === 1) {
            expiryDateConnector1 = parseData[3].expiryDate;
          } else if (connectorId === 2) {
            expiryDateConnector2 = parseData[3].expiryDate;
          } else {
          }
          reservationId = parseData[3].reservationId;
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
