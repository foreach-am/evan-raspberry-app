const net = require('net');
const url = require('url');
// const BluebirdPromise = require('bluebird');
const { Logger } = require('./Logger');

// const CheckerPromise = BluebirdPromise;
const CheckerPromise = Promise;

const checkHosts = [
  'google.com',
  'amazon.com',
  'evcharge-api-prod.e-evan.com',
];

const subdomains = ['', 'www'];
const protocols = ['https', 'http'];

const checkDomains = checkHosts
  .reduce(function (acc, domain) {
    const list =
      domain.split('.').length > 2
        ? [domain]
        : subdomains.map(function (subdomain) {
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

function checkSingleHost(domain) {
  let resolved = false;

  const promiseCallback = function (resolve) {
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

        if (!resolved) {
          resolve(result);
          resolved = true;
        }
      };
    };

    const netClient = new net.Socket();
    netClient.on('data', function () {});
    netClient.on('close', function () {});
    netClient.on('error', triggerResult(false));
    netClient.connect(connectionConfig, triggerResult(true));

    setTimeout(() => {
      triggerResult(false)();
    }, 2000);
  };

  return new CheckerPromise(promiseCallback);
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
