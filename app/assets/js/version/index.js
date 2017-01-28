/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */

function getVersion(fn) {
  const xhtr = new XMLHttpRequest();
  xhtr.open('GET', 'https://api.github.com/repos/dracotmolver/soube/releases/latest', true);
  xhtr.onload = () => {
    fn(JSON.parse(xhtr.response));
  };
  xhtr.send(null);
}

module.exports = getVersion;