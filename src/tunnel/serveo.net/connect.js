const Serveo = require('./Serveo');

module.exports = function (config) {
  const serveo = new Serveo(config);

  return {
    on(evt, listener) {
      serveo.on(evt, listener);
      return this;
    },

    off(evt, listener) {
      serveo.off(evt, listener);
      return this;
    },

    kill() {
      serveo.kill();
      return this;
    },

    unkill() {
      serveo.killed = false;
      return this;
    },

    info() {
      return serveo.SSHInfo();
    },

    pid() {
      if (serveo.ssh) return serveo.ssh.pid;
      else return null;
    },
  };
};
