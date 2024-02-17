const { execSync } = require('child_process');
const path = require('path');

const disableLoggingFor = [
  'out', // standard log outputs
  'error', // error outputs
];

function getFilePath(type, name) {
  const branch = execSync('git rev-parse --abbrev-ref HEAD');

  if (branch === 'main' && disableLoggingFor.includes(type)) {
    return '/dev/null';
  }

  return path.join(__dirname, '.logs', `${name}-${type}.log`);
}

function buildApp(configs) {
  return {
    exec_mode: 'cluster',
    cwd: __dirname,
    // log_date_format: 'YYYY.MM.DD HH:mm:ss Z',
    log_date_format: 'HH:mm:ss Z',
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
      script: 'npm',
      args: 'run start:prod',
    }),
    buildApp({
      name: 'jobs',
      instances: 1,
      script: 'jobs.js',
    }),
  ],
};
