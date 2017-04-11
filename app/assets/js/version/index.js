/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Functions --------------------------------- */
function getActualVersion(net, version, fn) {
  var data = '';
  const request = new net.ClientRequest({
    method: 'GET',
    protocol: 'https:',
    hostname: 'api.github.com',
    path: '/repos/dracotmolver/soube/releases/latest',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:51.0) Gecko/20100101 Firefox/51.0'
    }
  });

  request.chunkedEncoding = true;
  request.on('response', response => {
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      const diff = (b, c) => {
        let val = false;
        for (var i = 0, s = c.length; i < s; i++) {
          if (parseInt(c[i]) > parseInt(b[i])) {
            val = true;
            break;
          }
        }

        return val;
      };
      fn(diff(version.split('.'), JSON.parse(data).tag_name.split('.')) ? 'major' : 'same');
    });
  });

  request.on('error', error => {
    console.error(error);
  });

  request.end();
}

module.exports = getActualVersion;