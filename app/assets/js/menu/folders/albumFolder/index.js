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
const songFolder = require('./../songFolder');

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
    () => {}/*=> $('#add-songs').text(lang.config.loadingSongFolder)*/,
    (i, maxLength) => { // Iterator function
      // $('#add-songs').text(`${lang.config.loadingSongFolder}${Math.floor((i * 100) / maxLength)}%`);
      // $('#song-progress').css(`width:${(i * 100) / maxLength}%`);

      if (i === maxLength) createView(parentFolder, songFolder.getAllSongs());
    }
  );
}

function createView(folder, songs) {
  let div = CreateElement('div').addClass('grid-100');

  const fragment = document.createDocumentFragment();

  // Name of the band or artist
  fragment.appendChild(
    div.clone(true).attr({ id: 'album-title-artist' }).text(songs[0].artist).get()
  );

  // Name of the album
  fragment.appendChild(
    div.clone(true).attr({ id: 'album-title-album' }).text(path.basename(folder)).get()
  );
  
  // List of songs
  songs.forEach(s => fragment.appendChild(div.clone(false).addClass('album-title-song').rmAttr('id').text(s.title).get()));

  $('#album-to-play').append(fragment);
}

module.exports = Object.freeze({
  loadFullAlbum
});