/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
//---- Electron ----
const {
  ipcRendere,
  remote
} = require('electron');

// ---- Node ----
const url = require('url');
const path = require('path');

//----Own ----
const albumFolder = require('./albumFolder');
const songFolder = require('./songFolder');
const {
  configFile,
  langFile,
  editFile
} = require(path.join(__dirname, '../../', 'config')).init();
require(path.join(__dirname, '../../', 'dom'));

/* --------------------------------- Variables --------------------------------- */
let lang = langFile[configFile.lang];
let folderToRemove = '';
let isLoadingSongs = false;
let itemToRemove;

let li = CreateElement('li');

/* --------------------------------- Functions --------------------------------- */
function removeItem() {
  $('#remove-songs').removeClass('hide');
  itemToRemove = this;
  folderToRemove = itemToRemove.textContent;
  $('.warning').text(`${lang.config.removingSongFolder} ${folderToRemove}`);
}

// Get the path song
function saveSongList(parentFolder = '') {
  $('#add-songs').attr({ disabled: true });
  isLoadingSongs = true;
  configFile.musicFolder.push(parentFolder);
  editFile('config', configFile);

  $('#path-list-container')
    .append(li.clone(true).text(parentFolder).on({ click: removeItem }));

  // Show a loading
  // Read the content of the parent folder
  songFolder.addSongFolder(parentFolder,
    () => $('#add-songs').text(lang.config.loadingSongFolder),
    (i, maxLength) => { // Iterator function
      $('#add-songs').text(`${lang.config.loadingSongFolder}${Math.floor((i * 100) / maxLength)}%`);
      $('#song-progress').css(`width:${(i * 100) / maxLength}%`);

      if (i === maxLength) songFolder.updateSongList();
    }
  );
}

function loadFolder() {
  $($('.grid-container').get(0)).css('-webkit-filter:blur(1px)');
  $('#_addsongfolder').text(lang.config.addSongFolder);

  $('#path-list-container').empty();

  configFile.musicFolder.forEach(v => {
    $('#path-list-container').append(
      li.clone(true).text(v).on({ click: removeItem })
    )
  });

  $('#add-songs').on({
    click: () => {
      if (!isLoadingSongs) {
        // Action to add the songs
        remote.dialog.showOpenDialog({
          title: 'Add music folder',
          properties: ['openDirectory']
        }, parentFolder => {
          // console.log(url.parse(parentFolder[0], true), parentFolder[0]);
          if (parentFolder !== undefined) saveSongList(parentFolder[0]);
        });
      }
    }
  }).text(lang.config.addSongBtn);

  $('#remove-songs').on({
    click: () => {
      configFile.musicFolder = configFile.musicFolder.filter(v => folderToRemove !== v);
      editFile('config', configFile);
 
      itemToRemove.remove();
      songFolder.removeSongFolder(folderToRemove);

      $('#remove-songs').addClass('hide');
    }
  }).text(lang.config.removeSongBtn);

  // Execute the animation at the end of the code
  $($('.parent-container-config').get(0))
    .removeClass('hide')
    .child(0)
    .addClass('container-config-anim');
}

function close() {
  folderToRemove = '';
  isLoadingSongs = false;
  itemToRemove = null;
}

module.exports = Object.freeze({
  loadFullAlbum: albumFolder.loadFullAlbum,
  loadFolder,
  close
});