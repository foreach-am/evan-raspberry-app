const net = require('net');
const url = require('url');
const BluebirdPromise = require('bluebird');
const { Logger } = require('./Logger');

BluebirdPromise.config({ cancellation: true });

const checkHosts = ['google.com', 'amazon.com', 'apple.com', 'facebook.com'];
const subdomains = ['', 'www'];
const protocols = ['https', 'http'];

const checkDomains = checkHosts
  .reduce(function (acc, domain) {
    const list = subdomains.map(function (subdomain) {
      return !subdomain ? domain : `${subdomain}.${domain}`;
    });
    return [...acc, ...list];
  }, [])
  .reduce(function (acc, domain) {
    const list = protocols.map(function (protocol) {
      return !protocol ? domain : `${protocol}://${domain}`;
    });
    return [...acc, ...list];
  }, []);

function checkSingleHost(domain, timeout = 1000) {
  const promiseCallback = function (resolve, reject, onCancel) {
    const urlInfo = url.parse(domain);
    if (urlInfo.port === null) {
      if (urlInfo.protocol === 'http:') {
        urlInfo.port = '80';
      } else if (urlInfo.protocol === 'https:') {
        urlInfo.port = '443';
      }
    }

    const connectionPort = Number.parseInt(urlInfo.port || '80');
    const connectionHostname = urlInfo.hostname || urlInfo.pathname;
    const connectionConfig = {
      port: connectionPort,
      host: connectionHostname,
    };

    const triggerResult = function (result) {
      return function () {
        netClient.destroy();
        resolve(result);
      };
    };

    const netClient = new net.Socket();
    onCancel(function () {
      netClient.destroy();
    });

    netClient.on('data', function () {});
    netClient.on('close', function () {});
    netClient.on('error', triggerResult(false));
    netClient.connect(connectionConfig, triggerResult(true));
  };

  return new BluebirdPromise(promiseCallback).timeout(timeout);
}

async function isConnectedToInternet() {
  for (const domain of checkDomains) {
    const success = await checkSingleHost(domain);
    Logger.info(
      `Checking network connection with domain [${domain}]:`,
      success ? 'success' : 'failed'
    );

    if (success) {
      return true;
    }
  }

  return false;
}

module.exports = {
  Networking: {
    isConnected: isConnectedToInternet,
  },
};
