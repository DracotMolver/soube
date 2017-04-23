/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
//---- Electron ----
const { dialog } = require('electron').remote;

//---- Node ----
const path = require('path');

//---- Own ----
const songFolder = require(path.join(__dirname, '../', 'songFolder'));
const {
  configFile,
  langFile
} = require(path.join(__dirname, '../../../', 'config')).init();
let player = require(path.join(__dirname, '../../../', 'player'));

/* --------------------------------- Variables --------------------------------- */
const lang = langFile[configFile.lang];

/* --------------------------------- Functions --------------------------------- */
function loadFullAlbum() {
  dialog.showOpenDialog({
    title: 'Open an album',
    properties: ['openDirectory']
  }, parentFolder => {
    if (parentFolder !== undefined) getSongs(parentFolder[0]);
  });
}

function getSongs(parentFolder) {
  songFolder.addSongFolder(parentFolder,
  () => $('#album-to-play-container').removeClass('hide'),
  (i, maxLength) => { // Iterator function
    $('#album-to-play').removeClass('hide').text(
      `<div id="album-loading">${lang.config.loadingAlbumFolder}${Math.floor((i * 100) / maxLength)}%</div>`
    );
    
    if (i === maxLength) createView(parentFolder, songFolder.getAllSongs());
  }, true);
}

function createView(folder, songs) {
  player.controls.stopSong();
  player.createAlbumView(Object.assign({}, player), folder, songs);
}

module.exports = Object.freeze({
  loadFullAlbum
});