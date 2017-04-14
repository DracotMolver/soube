/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
//---- nodejs ----
const fs = require('fs');

//---- electron ----
const {
  ipcRenderer,
  remote,
  net
} = require('electron');

//---- own ----
const version = require('./../version');

/* --------------------------------- Functions --------------------------------- */
// Will create all the files needed by the music player.
// Some old files (old soubes versions) will be overwritens.
// This function will checks for two files:
// - config.json
// - listSong.json
function createFiles(app) {
  /* --------------------------------- Configuration --------------------------------- */
  //---- constants ----
  const path = app.getPath('userData');
  const configPath = `${path}/config.json`;
  const listSongPath = `${path}/listSong.json`;

  if (!fs.existsSync(configPath)) {
    // Values by default
    const config = {
      lang: 'us',
      shuffle: true,
      musicFolder: [],
      equalizer: {
        reset: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        rock: [80, 103, 105, 121, 145, 128, 125, 123, 122, 143, 163, 134, 135, 129, 139, 146, 144, 153, 152, 149, 124, 102, 103],
        electro: [99, 133, 102, 122, 100, 139, 125, 151, 158, 152, 124, 116, 116, 117, 147, 100, 139, 173, 112, 135, 165, 85, 121],
        acustic: [104, 124, 141, 0, 0, 104, 0, 104, 117, 0, 0, 0, 107, 104, 109, 123, 92, 107, 0, 154, 113, 84, 90]
      },
      equalizerConfig: 'reset'
    };

    fs.openSync(configPath, 'w');
    fs.writeFileSync(configPath, JSON.stringify(config, null), { flag: 'w' });
  }
   else {
    // ONLY TO UPDATE THE CONFIG FILE
    var actualVersion = app.getVersion().toString();
    version(net, actualVersion, response => {
      if (response === 'major') {
        let config = JSON.parse(fs.readFileSync(configPath).toString());
        config.equalizer = {
          reset: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          rock: [80, 103, 105, 121, 145, 128, 125, 123, 122, 143, 163, 134, 135, 129, 139, 146, 144, 153, 152, 149, 124, 102, 103],
          electro: [99, 133, 102, 122, 100, 139, 125, 151, 158, 152, 124, 116, 116, 117, 147, 100, 139, 173, 112, 135, 165, 85, 121],
          acustic: [104, 124, 141, 0, 0, 104, 0, 104, 117, 0, 0, 0, 107, 104, 109, 123, 92, 107, 0, 154, 113, 84, 90]
        };
        if (typeof config.musicFolder === 'string') {
          config.musicFolder = [config.musicFolder];
          fs.writeFileSync(configPath, JSON.stringify(config, null), { flag: 'w' });
        }  
      }
    });
  }

  /* --------------------------------- File of songs --------------------------------- */
  if (!fs.existsSync(listSongPath)) {
    fs.openSync(listSongPath, 'w');
    fs.writeFileSync(listSongPath, JSON.stringify({}, null), { flag: 'w' });
  }
}

// Will save the files config.json and listSong.json if needed.
function editFile(fileName, data) {
//---- constants ----
  fs.writeFile(`${remote.app.getPath('userData')}/${fileName}.json`, JSON.stringify(data, null), err => {
    if (fileName === 'listSong') ipcRenderer.send('update-browser');
  });
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