/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
//---- electron ----
const remote = require('electron').remote;

/* --------------------------------- Functions --------------------------------- */
function getVersion(fn) {
  const xhtr = new XMLHttpRequest();
  xhtr.open('GET', 'https://api.github.com/repos/dracotmolver/soube/releases/latest', true);
  xhtr.onload = () => {
    const actualVersion = remote.app.getVersion().toString().split('.');
    const newVersion = JSON.parse(xhtr.response).tag_name.split('.');

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
  };
  xhtr.send(null);
}

module.exports = getVersion;