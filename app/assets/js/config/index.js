const configFiles = require('./configFiles');
const { remote } = require('electron');

function createFiles(path) {
  configFiles.makeFiles(path);
}

function config() {
  const configFile = require(`${remote.app.getPath('userData')}/config.json`);
  const langFile = require('./lang.json');

  let config = {
    lang,
    shuffle,
    musicFolder,
    equalizer
  } = configFile;

  config.langFile = langFile;

  return config;
}

function songsFile() {
  return require(`${remote.app.getPath('userData')}/listSong.json`);
}

module.exports = Object.freeze({
  createFiles,
  config,
  songsFile
});