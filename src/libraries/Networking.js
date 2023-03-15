const net = require('net');
const url = require('url');

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

function checkSingleHost(domain) {
  return new Promise(function (resolve) {
    const urlInfo = url.parse(domain);
    if (urlInfo.port === null) {
      if (urlInfo.protocol === 'http:') {
        urlInfo.port = '80';
      } else if (urlInfo.protocol === 'https:') {
        urlInfo.port = '443';
      }
    }

    const connectionPort = Number.parseInt(urlInfo.port || '80');
    const connectionConfig = { port: connectionPort, host: hostname };

    const triggerResult = function (result) {
      return function () {
        netClient.destroy();
        resolve(result);
      };
    };

    const netClient = new net.Socket();
    netClient.on('data', function () {});
    netClient.on('close', function () {});
    netClient.on('error', triggerResult(false));
    netClient.connect(connectionConfig, triggerResult(true));
  });
}

async function isConnectedToInternet() {
  for (const domain of checkDomains) {
    const success = await checkSingleHost(domain);
    console.log(` >>>>> NetworkChecking: [domain]:`, success);

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
