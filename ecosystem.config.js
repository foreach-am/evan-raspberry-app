module.exports = {
  apps: [
    {
      name: 'raspberry-client-app',
      exec_mode: 'cluster',
      instances: 1,
      cwd: __dirname,
      script: './index.js',
    },
  ],
};
