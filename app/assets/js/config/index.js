/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
//---- nodejs ----
const fs = require('fs');
const path = require('path');

//---- electron ----
const {
  ipcRenderer,
  remote,
  net
} = require('electron');

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
        reset: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        rock: [50, 70, 94, 160, 160, 160, 146, 146, 135, 133, 126, 126, 105, 100, 70],
        electro: [40, 84, 110, 160, 160, 175, 188, 104, 110, 110, 126, 135, 110, 110, 70],
        acustic: [86, 94, 132, 156, 132, 115, 110, 110, 104, 110, 115, 115, 120, 126, 146]
      },
      equalizerConfig: 'reset',
      theme: 'pink-theme'
    };

    fs.openSync(configPath, 'w');
    fs.writeFileSync(configPath, JSON.stringify(config, null), { flag: 'w' });
  } else {
    //   // ONLY TO UPDATE THE CONFIG FILE
    //   var actualVersion = app.getVersion().toString();
    //   if (response === 'major') {
    // let config = JSON.parse(fs.readFileSync(configPath).toString());
    // if (typeof config.musicFolder === 'string') {
    //       config.equalizer = {
    //         reset: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        // rock: [50, 70, 94, 160, 160, 160, 146, 146, 135, 133, 126, 126, 105, 100, 70],
        // electro: [40, 84, 110, 160, 160, 175, 188, 104, 110, 110, 126, 135, 110, 110, 70],
        // acustic: [86, 94, 132, 156, 132, 115, 110, 110, 104, 110, 115, 115, 120, 126, 146]
    //       };
    //     config.theme: 'pink-theme';
    // config.equalizerConfig: 'reset';
    //       config.musicFolder = [config.musicFolder];
    //       fs.writeFileSync(configPath, JSON.stringify(config, null), { flag: 'w' });
    //     }
    // }
  }

  /* --------------------------------- File of songs --------------------------------- */
  if (!fs.existsSync(listSongPath)) {
    fs.openSync(listSongPath, 'w');
    fs.writeFileSync(listSongPath, JSON.stringify({}, null), { flag: 'w' });
  }
}

// Will save the files config.json and listSong.json if needed.
function editFile(fileName, data, fullPath = false) {
  if (fullPath) {
    fs.writeFile(fileName, data, function (err) {
      ipcRenderer.send('update-browser');
    });
  } else {
    fs.writeFile(
      `${remote.app.getPath('userData')}/${fileName}.json`,
      JSON.stringify(data, null),
      function (err) {
        if (fileName === 'listSong') ipcRenderer.send('update-browser');
      });
  }
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
    langFile: require('./lang'),
    coloursFile: require('./colours')
  }
}

module.exports = Object.freeze({
  createFiles,
  init
});