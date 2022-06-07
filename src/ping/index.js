const sendBootNotificationHandler = require('./senders/BootNotification');
const sendAuthorizeHandler = require('./senders/Authorize');
const sendHeartBeatHandler = require('./senders/HearthBeat');
const sendStartTransactionHandler = require('./senders/StartTransaction');
const sendStopTransactionHandler = require('./senders/StopTransaction');
const sendReservationHandler = require('./senders/Reservation');
const sendChangeAvailabilityHandler = require('./senders/ChangeAvailability');

module.exports = {
  sendBootNotification: sendBootNotificationHandler,
  sendAuthorize: sendAuthorizeHandler,
  sendHearthBeat: sendHeartBeatHandler,
  sendStartTransaction: sendStartTransactionHandler,
  sendStopTransaction: sendStopTransactionHandler,
  sendReservation: sendReservationHandler,
  sendChangeAvailability: sendChangeAvailabilityHandler,
};
