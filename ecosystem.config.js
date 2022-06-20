const path = require('path');

module.exports = {
  apps: [
    {
      name: 'raspberry-client-app',
      exec_mode: 'cluster',
      min_uptime: '15s',
      instances: 1,
      cwd: __dirname,
      script: './index.js',
      log_date_format: 'YYYY.MM.DD HH:mm Z',
      error_file: path.join(__dirname, '.logs', 'error-XXX.log'),
      out_file: path.join(__dirname, '.logs', 'out-XXX.log'),
    },
  ],
};
