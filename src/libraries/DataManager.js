const path = require('path');

module.exports.getFilePath = function (...fileName) {
  return path.join(__dirname, '..', '..', 'data', ...fileName);
};
