const fs = require('fs');

let path = '';

function setPath (_path) { path = _path; }

function makeFiles () {
  // Config.json
  const configPath = `${path}/config.json`;
  fs.stat(configPath, (err, stats) => {
    if (err) {
      const config = {
        lang: 'us',
        shuffle: true,
          musicFolder: '',
          equalizer: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      };

      fs.open(configPath, 'w', (err, fd) => {
        if (err) return;

        fs.writeFileSync(configPath, JSON.stringify(config, null), { encoding: 'utf8', flag: 'w' });
        fs.closeSync(fd);
      });
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