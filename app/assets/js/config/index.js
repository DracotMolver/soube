/**
 * @author Diego Alberto Molina Vera
 */
/* --------------------------------- Modules --------------------------------- */
// Nodejs modules
const fs = require('fs');

// Electron modules
const remote = require('electron').remote;

/* --------------------------------- Functions --------------------------------- */
// Will create all the files needed by the music player.
// Some old files (old soubes versions) will be overwritens.
// This function will checks for two files:
// - config.json
// - listSong.json
function createFiles(path) {
  /* --------------------------------- Configuration --------------------------------- */
  const CONFIG_PATH = `${path}/config.json`;
  const EQ = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  fs.stat(CONFIG_PATH, (err, stats) => {
    if (err) {
      // Values by default
      const CONFIG = {
        lang: 'us',
        shuffle: true,
        musicFolder: '',
        equalizer: EQ
      };

      fs.open(CONFIG_PATH, 'w', (err, fd) => {
        if (err) return;

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(CONFIG, null), { flag: 'w' });
        fs.closeSync(fd);
      });
    } else {
      // ONLY FOR VERSIONS LOWER THAN 1.3.2
      let config = JSON.parse(fs.readFileSync(CONFIG_PATH).toString());
      if (config.equalizer.length < 23) {
        config.equalizer = EQ;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null), { flag: 'w' });
      }
    }
  });

  /* --------------------------------- File of songs --------------------------------- */
  const LIST_SONG_PATH = `${path}/listSong.json`;
  fs.stat(LIST_SONG_PATH, (err, stats) => {
    if (err) {
      fs.open(LIST_SONG_PATH, 'w', (err, fd) => {
        if (err) return;

        fs.writeFileSync(LIST_SONG_PATH, JSON.stringify({}, null), { flag: 'w' });
        fs.closeSync(fd);
      });
    }
  });
}

// Will save the files config.json and listSong.json if needed.
function editFile(fileName, data) {
  fs.writeFile(`${remote.app.getPath('userData')}/${fileName}.json`, JSON.stringify(data, null), err => { });
}

// Will get all the config files.
// config.json [.confg] path
// lang.json [local project] path
// listSong.json [.config] path
function init() {
  return {
    editFile,
    configFile: require(`${remote.app.getPath('userData')}/config.json`),
    listSongs: require(`${remote.app.getPath('userData')}/listSong.json`),
    langFile: require('./lang.json')
  }
}

module.exports = Object.freeze({
  createFiles,
  init
});