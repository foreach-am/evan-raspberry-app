module.exports = {
  apps: [
    {
      name: 'raspberry-client-app',
      exec_mode: 'cluster',
      min_uptime: '15s',
      instances: 1,
      cwd: __dirname,
      script: './index.js',
    },
  ],
};
