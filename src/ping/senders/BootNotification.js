const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_BOOT_NOTIFICATION;

function sendBootNotification({}) {
  WebSocketSender.send(SendTypeEnum.Request, event, {
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

function sendBootNotificationHandler() {
  const data = {};

  return EventQueue.register(event, null, data, sendBootNotification);
}

module.exports = {
  execute: sendBootNotificationHandler,
  enums: {},
};
