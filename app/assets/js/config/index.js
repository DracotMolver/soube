/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
//---- nodejs ----
const fs = require('fs');

//---- electron ----
const remote = require('electron').remote;

/* --------------------------------- Functions --------------------------------- */
// Will create all the files needed by the music player.
// Some old files (old soubes versions) will be overwritens.
// This function will checks for two files:
// - config.json
// - listSong.json
function createFiles(path) {
  /* --------------------------------- Configuration --------------------------------- */
  //---- constants ----
  const CONFIG_PATH = `${path}/config.json`;

  fs.stat(CONFIG_PATH, (err, stats) => {
    if (err) {
      // Values by default
      const CONFIG = {
        lang: 'us',
        shuffle: true,
        musicFolder: '',
        equalizer: {
          reset: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          rock: [70, 103, 105, 121, 145, 128, 125, 123, 122, 143, 163, 134, 135, 129, 139, 146, 144, 153, 152, 149, 124, 102, 103],
          electro: [99, 133, 102, 122, 100, 139, 125, 151, 158, 152, 124, 116, 116, 117, 147, 100, 139, 173, 112, 135, 165, 85, 121],
          acustic: [104, 124, 141, 0, 0, 104, 0, 104, 117, 0, 0, 0, 107, 104, 109, 123, 92, 107, 0, 154, 113, 84, 90]
        },
        equalizerConfig: 'reset'
      };

      fs.open(CONFIG_PATH, 'w', (err, fd) => {
        if (err) {
          remote.dialog.showErrorBox('Error [004]', `It was an error trying to create the configs needed files.\n${err}`);
          return;
        }

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(CONFIG, null), { flag: 'w' });
        fs.closeSync(fd);
      });
    } else {
        // ONLY FOR VERSIONS LOWER THAN 1.3.2
        let config = JSON.parse(fs.readFileSync(CONFIG_PATH).toString());
        if (config.equalizer.length < 23)
          fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null), { flag: 'w' });
      }
  });

  /* --------------------------------- File of songs --------------------------------- */
  const LIST_SONG_PATH = `${path}/listSong.json`;
  fs.stat(LIST_SONG_PATH, (err, stats) => {
    if (err) {
      fs.open(LIST_SONG_PATH, 'w', (err, fd) => {
        if (err) {
          remote.dialog.showErrorBox('Error [005]', `It was an error trying to create the configs needed files.\n${err}`);
          return;
        }

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