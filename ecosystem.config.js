const path = require('path');

function buildApp(configs) {
  return {
    exec_mode: 'cluster',
    cwd: __dirname,
    log_date_format: 'YYYY.MM.DD HH:mm Z',
    error_file: path.join(__dirname, '.logs', `${configs.name}-error.log`),
    out_file: path.join(__dirname, '.logs', `${configs.name}-out.log`),
    ...configs,
  };
}

module.exports = {
  apps: [
    buildApp({
      name: 'raspberry-client-app',
      min_uptime: '15s',
      instances: 1,
      script: './index.js',
    }),
  ],
};
