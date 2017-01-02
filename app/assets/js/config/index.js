/**
 * @author Diego Alberto Molina Vera
 */
/* --------------------------------- Modules --------------------------------- */
// Nodejs module
const fs = require('fs');

// Electron module
const remote = require('electron').remote;

/* --------------------------------- Functions --------------------------------- */
/**
 * Will create all the files needed by the music player.
 * Some old files (old soubes versions) will be overwritens.
 * This function will checks for two files:
 *  - config.json
 *  -listSong.json
 * 
 * @var {String} path Path where is the .confg folder created by Chrome
 */
function createFiles(path) {
  /* --------------------------------- Configuration --------------------------------- */
  const configPath = `${path}/config.json`;
  const eq = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  fs.stat(configPath, (err, stats) => {
    if (err) {
      // Values by default
      const config = {
        lang: 'us',
        shuffle: true,
        musicFolder: '',
        equalizer: eq
      };

      fs.open(configPath, 'w', (err, fd) => {
        if (err) return;

        fs.writeFileSync(configPath, JSON.stringify(config, null), { flag: 'w' });
        fs.closeSync(fd);
      });
    } else {
      // ONLY FOR VERSIONS LOWER THAN 1.3.2
      let config = JSON.parse(fs.readFileSync(configPath).toString());
      if (config.equalizer.length < 23) {
        config.equalizer = eq;
        fs.writeFileSync(configPath, JSON.stringify(config, null), { flag: 'w' });
      }
    }
  });

  /* --------------------------------- File of songs --------------------------------- */
  const listSongPath = `${path}/listSong.json`;
  fs.stat(listSongPath, (err, stats) => {
    if (err) {
      fs.open(listSongPath, 'w', (err, fd) => {
        if (err) return;

        fs.writeFileSync(listSongPath, JSON.stringify({}, null), { flag: 'w' });
        fs.closeSync(fd);
      });
    }
  });
}

/**
 * Will save the files config.json and listSong.json if needed.
 * 
 * @var {String} fileName Name of the file to save changes.
 * @var {Object} data JSON object to save into the file.
 */
function editFile(fileName, data) {
  fs.writeFile(`${remote.app.getPath('userData')}/${fileName}.json`, JSON.stringify(data, null), err => { });
}

/**
 * Will get all the config files.
 * - config.json // .confg
 * - lang.json // local project
 * - listSong.json // .config
 * 
 * @return {Object} return an object.
 */
function init() {
  const configFile = require(`${remote.app.getPath('userData')}/config.json`);
  const langFile = require('./lang.json');
  const listSongs = require(`${remote.app.getPath('userData')}/listSong.json`);;

  return {
    editFile,
    configFile,
    listSongs,
    langFile
  }
}

module.exports = Object.freeze({
  createFiles,
  init
});