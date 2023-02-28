const ping = require('../../ping');

function closePreviousTransactions() {
  // ...
}

function sendBootNotification() {
  ping.BootNotification.execute(uuid());
}

module.exports = async function () {
  closePreviousTransactions();
  sendBootNotification();
};
