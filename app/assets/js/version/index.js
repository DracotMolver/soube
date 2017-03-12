/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
//---- Node ----
const https = require('https');

/* --------------------------------- Functions --------------------------------- */
function getActualVersion(version, fn) {
  https.get({
    host: 'api.github.com',
    path: '/repos/dracotmolver/soube/releases/latest',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:51.0) Gecko/20100101 Firefox/51.0'
    }
  }, res => {
    var data = '';
    res.setEncoding('utf8')
    .on('data', d => {
      data += d;
    })
    .on('end', () => {
      const actualVersion = version.split('.');
      const newVersion = JSON.parse(data).tag_name.split('.');

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

      fn(diff(actualVersion, newVersion) ? 'major' : 'same');
    });
  }).on('error', er => {
    console.log('err', er);
  }).end();
}

module.exports = getActualVersion;