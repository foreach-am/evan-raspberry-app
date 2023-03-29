const path = require('path');

const disableLoggingFor = ['out', 'error'];
function getFilePath(type, name) {
  if (disableLoggingFor.includes(type)) {
    // return '/dev/null';
  }

  return path.join(__dirname, '.logs', `${name}-${type}.log`);
}

function buildApp(configs) {
  return {
    exec_mode: 'cluster',
    cwd: __dirname,
    log_date_format: 'YYYY.MM.DD HH:mm Z',
    error_file: getFilePath('error', configs.name),
    out_file: getFilePath('out', configs.name),
    env: {
      NODE_ENV: 'production',
    },
    ...configs,
  };
}

module.exports = {
  apps: [
    buildApp({
      name: 'app',
      min_uptime: '5s',
      instances: 1,
      script: './index.js',
    }),
    // buildApp({
    //   name: 'tunnel',
    //   instances: 1,
    //   script: './tunnel.js',
    // }),
  ],
};
