const { Gpio } = require('onoff');

const buttonReset = new Gpio(5, 'out', 'rising', {
  debounceTimeout: 500,
});

function restart() {
  return new new Promise(function (resolve, reject) {
    buttonReset.write(1, function (error, value) {
      if (error) {
        return reject(error);
      }

      buttonReset.write(0, function (error, value) {
        if (error) {
          return reject(error);
        }

        resolve();
      });
    });
  })();
}

process.on('SIGINT', function () {
  led.unexport();
  button.unexport();
});

module.exports = {
  Raspberry: {
    restart,
  },
};
