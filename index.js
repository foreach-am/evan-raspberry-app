global.ROOT_DIR = __dirname;

function startApp() {
  require('./src/configure');
  require('./src/client');
  require('./src/lighting');
}

setTimeout(function () {
  startApp();
}, 30_000);
