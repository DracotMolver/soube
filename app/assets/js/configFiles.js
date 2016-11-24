/**
 * @author Diego Molina Vera.
 */
const fs = require('fs');

let path = '';

function setPath (app) { path = app.getPath('userData'); }

function makeFiles () {
  // Config.json
  const configPath = `${path}/config.json`;
  const eq = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  fs.stat(configPath, (err, stats) => {
    if (err) {
      const config = {
        lang: 'us',
        shuffle: true,
          musicFolder: '',
          equalizer: eq
      };

      fs.open(configPath, 'w', (err, fd) => {
        if (err) return;

        fs.writeFileSync(configPath, JSON.stringify(config, null), { encoding: 'utf8', flag: 'w' });
        fs.closeSync(fd);
      });
    } else {
      let config = JSON.parse(fs.readFileSync(configPath).toString());
      if (config.equalizer.length < 23) {
        config.equalizer = eq;
        fs.writeFileSync(configPath, JSON.stringify(config, null), { encoding: 'utf8', flag: 'w' });
      }
    }
  });

  // listSong.json
  const listSongPath = `${path}/listSong.json`;
  fs.stat(listSongPath, (err, stats) => {
    if (err) {
      fs.open(listSongPath, 'w', (err, fd) => {
        if (err) return;

        fs.writeFileSync(listSongPath, JSON.stringify({}, null), { encoding: 'utf8', flag: 'w' });
        fs.closeSync(fd);
      });
    }
  });
}

module.exports = Object.freeze({
    setPath,
    makeFiles
});