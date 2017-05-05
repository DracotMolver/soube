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
const $ = require(path.join(__dirname, '../../../', 'dom'));

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
    () => $('#album-to-play-container').switchClass('hide', 'album-to-play-anim'),
    (i, maxLength) => { // Iterator function
      $('#album-to-play').text(
        `<div id="album-loading">${lang.config.loadingAlbumFolder}${Math.floor((i * 100) / maxLength)}%</div>`
      );

      if (i === maxLength) createView(parentFolder, songFolder.getAllSongs());
    }, true);
}

function createView(folder, songs) {
  player.getMediaControl(player.mediaControl).stopSong();
  player.mediaControl = 'album';
  player.getMediaControl(player.mediaControl).setSongs(songs);
  player.createAlbumView(player, folder, songs);
}

function closeAlbum() {
  player.getMediaControl(player.mediaControl).stopSong();
  player.mediaControl = 'player';
  $('#album-to-play-container').switchClass('album-to-play-anim', 'hide');
}

module.exports = Object.freeze({
  loadFullAlbum,
  closeAlbum
});