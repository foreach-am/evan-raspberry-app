const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_BOOT_NOTIFICATION;

function sendBootNotification(data) {
  WebSocketSender.send(event, {
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

function sendBootNotificationHandler(data) {
  return EventQueue.register(event, data, function () {
    sendBootNotification(data);
  });
}

module.exports = sendBootNotificationHandler;
