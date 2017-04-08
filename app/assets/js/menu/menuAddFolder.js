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

// ---- Nodejs ----
const url = require('url');

//----Oown ----
const PLAYER = require('./../factory')('player');
const {
  configFile,
  langFile,
  editFile
} = require('./../config').init();
require('./../dom');

/* --------------------------------- Variables --------------------------------- */
let lang = langFile[configFile.lang];
let folderToRemove = '';
let itemToRemove;
let isLoadingSongs = false

/* --------------------------------- Functions --------------------------------- */
function removeItem() {
  $('#remove-songs').removeClass('hide');
  itemToRemove = this;
  folderToRemove = itemToRemove.textContent;
  $('#folder-to-remove').text(`${lang.config.removingSongFolder} ${folderToRemove}`);
}

// Get the path song
function saveSongList(parentFolder = '') {
  $('#add-songs').text(lang.config.loadingSongFolder).attr('disabled', true);
  isLoadingSongs = true;
  configFile.musicFolder.push(parentFolder);
  editFile('config', configFile);

  $('#path-list-container').insert(
    $('li').clone(true).text(parentFolder).on({
      click: removeItem
    })
  );

  // Show a loading
  // Read the content of the parent folder
  PLAYER.addSongFolder(parentFolder,
    () => { },
    (i, maxLength) => { // Iterator function
      $('#song-progress').css(`width:${(i * 100) / maxLength}%`);
      if (i === maxLength) PLAYER.updateSongList();
    }
  );
}

function loadFolder() {
  $($('.grid-container').get(0)).css('-webkit-filter:blur(1px)');
  $('#menu-add-songs').removeClass('hide');
  $('#_addsongfolder').text(lang.config.addSongFolder);

  configFile.musicFolder.forEach(v => {
    $('#path-list-container').insert(
      $('li').clone(true).text(v).on({
        click: removeItem
      })
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
      $('#remove-songs').addClass('hide');
      PLAYER.removeSongFolder(folderToRemove);
    }
  }).text(lang.config.removeSongBtn);
}

module.exports = Object.freeze({
  loadFolder
});