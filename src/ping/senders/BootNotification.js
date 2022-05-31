const { EventQueue, EventQueueEnum } = require('../../libs/EventQueue');
const { WebSocketSender } = require('../../libs/WebSocket');

const commandName = 'BootNotification';
const event = EventQueueEnum.EVENT_BOOT_NOTIFICATION;

function sendBootNotification(data, transactionId) {
  WebSocketSender.send(transactionId, commandName, {
    chargePointVendor: 'EVAN',
    chargePointModel: 'EVAN F7/22',
    chargePointSerialNumber: 'Evan.000.00.1',
    chargeBoxSerialNumber: 'Evan.000.00.1',
    firmwareVersion: 'TriplePhase_5.0',
    iccid: '',
    imsi: '',
    meterType: 'CUR_SENSE_40A',
    meterSerialNumber: 'Evan.000.00.1',
  });
}

function sendBootNotificationHandler(data, args) {
  return EventQueue.register(event, data, function () {
    sendBootNotification(data, args.transactionId);
  });
}

module.exports = sendBootNotificationHandler;
