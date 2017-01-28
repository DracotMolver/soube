/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/** --------------------------------------- Modules --------------------------------------- **/
//---- Electron ----
const ipcRenderer = require('electron').ipcRenderer;

//---- own ----
const PLAYER = require('./factory')('player');
const version = require('./version');
const config = require('./config');
const {
    configFile,
    langFile,
    listSongs
} = config.init();
require('./dom');

/** --------------------------------------- Variables --------------------------------------- **/
//---- constants ----
const LAPSE_POPUP = 4500; // Duration of info popups
const LAPSE_SCROLLING = 60; // Lapse before do scrolling
const MAX_ELEMENTS = 20; // Max of elementos to display when is filtering a song [searching bar]
const BTN_FILTER_SONGS = [ // Elements to use as a items into the slide
  $('div').clone(false).addClass('grid-25 mobile-grid-25'),
  $('div').clone(false).addClass('search-results'),
  $('div').clone(false).addClass('results')
];

//---- normals ----
let lang = langFile[configFile.lang];
let clickedElement = null; // When you do click on the name of the song
let positionElement = null; // Where is the song that you clicked on.
let isSearchDisplayed = false; // Checks if it was launched the searching bar
let totalResults = 0; // Amount of songs filtered
let searchValue = ''; // The input text to search for
let tempSlide = 0; // To create the pagination
let countSlide = 0;
let searchBy = 'title';
let fragmentSlide = null; // DocumentFragment() slide container
let fragmentItems = null; // DocumentFragment() button container
let slide = 0; // Amount of slides to make
let regex = null; // The name of the song to searching for as a regular expression
let list = []; // Filtered songs.

/** --------------------------------------- Functions --------------------------------------- **/
// Check if there's a new version to download
function getActualVersion() {
  version(response => {
    if (response === 'major') {
      $('#pop-up-container')
      .removeClass('hide')
      .child(0)
      .addClass('pop-up-anim')
      .text(
        `<a href="http://soube.diegomolina.cl">${lang.alerts.newVersion}</a>`
      );

      $(':a').on({
        click: function (e) {
          e.preventDefault();
          shell.openExternal(this.href);
        }
      });

      let tout = setTimeout(() => {
        $('#pop-up-container')
        .addClass('hide')
        .child(0)
        .removeClass('pop-up-anim');

        if (Object.keys(listSongs).length !== 0) checkNewSongs();

        clearTimeout(tout);
      }, LAPSE_POPUP);
    }
  });
}

// Main function!!
function loadSongs() {
  // Enable shuffle
  if (configFile.shuffle) $('#shuffle-icon').css('fill:#FBFCFC');

  getActualVersion();
  if (Object.keys(listSongs).length === 0) {
    $('#list-songs').text(
      `<div id="init-message">${lang.alerts.welcome}</div>`
    );
  } else {
    // Render the list of songs
    PLAYER.createView(PLAYER);
  }

  // Make all the config files
  config.createFiles();
}
loadSongs();

function hideSearchInputData() {
  $('#search-result').empty();
  $('#search-container').addClass('hide');
  $('#search-wrapper').removeClass('search-wrapper-anim');
  $($('.grid-container').get(0)).rmAttr('style');
  $('#search').removeClass('input-search-anim');
  isSearchDisplayed = false;
}

// This function is use into the function itemSlide
function selectedSong (position) {
  PLAYER.controls.playSongAtPosition(position);
  hideSearchInputData();
}

// will be executed every time the user hit down a keyword
// So, I carefully tried to do a clean, cheaper and faster code :).
function searchInputData(e) {
  // Clean if there's no coincidence
  $('#wrapper-results').removeClass('no-searching-found').empty();
  $('#pagination').addClass('hide');

  searchValue = this.value.trim();

  if (searchValue !== '') {
    countSlide = 0;
    // Complete the text
    if (e.key === 'ArrowRight' && searchValue.length > 1)
      this.value = $('#search-result').text();


    regex = new RegExp(`${searchValue.replace(/\s+/g, '&nbsp;')}`, 'ig');
    list = listSongs.filter(v => regex.test(v[searchBy]));

    if (e.key === 'Enter') selectedSong(list[list.length - 1].position);

    // Show possibles results
    totalResults = list.length - 1;
    tempSlide = slide = totalResults > MAX_ELEMENTS ? Math.floor(totalResults / MAX_ELEMENTS) : 1;
    fragmentSlide = fragmentItems = document.createDocumentFragment();

    // Make an slide with all the filtered coincidences
    const FILTERED_SONGS = totalResults < MAX_ELEMENTS ? totalResults + 1 : MAX_ELEMENTS;
    if (list.length > 0) {
      while (slide--) {
        for (var i = 0; i < FILTERED_SONGS; i++ , totalResults--) {
          fragmentItems.appendChild(
            BTN_FILTER_SONGS[0].clone(true)
            .insert(
              BTN_FILTER_SONGS[1].clone(true)
              .text(list[totalResults][searchBy])
            )
            .data({ position: list[totalResults].position })
            .on({
              click: function() {
                selectedSong($(this).data('position'));
              }
            }).get()
          );
        }

        // All the buttons into the slides
        fragmentSlide.appendChild(
          BTN_FILTER_SONGS[2].clone(true)
          .insert(fragmentItems)
          .css(`width:${document.body.clientWidth}px`).get()
        );
        fragmentItems = document.createDocumentFragment();
      }

      // Add the pagination if there's more than one slide
      tempSlide > 1 ?
      $('#pagination').removeClass('hide').child(1).addClass('arrow-open-anim') :
      $('#pagination').addClass('hide');

      // Display all the filtered songs
      $('#wrapper-results').empty()
      .insert(fragmentSlide)
      .css(`width:${tempSlide * document.body.clientWidth}px`);

    } else {
      // Clean if there's no coincidence
      $('#wrapper-results')
      .text(':( It seems that you don\'t have what you\'re searching for.')
      .addClass('no-searching-found');
      $('#pagination').addClass('hide');
    }
  }

  // Show the first coincidence to show as a "ghost text".
  $('#search-result').text(list.length > 0 ? list[list.length - 1][searchBy] : '');
}

// Check if there are new songs to be added
function checkNewSongs() {
  PLAYER.addSongFolder(configFile.musicFolder, () => {
    // show pop-up
    $('#pop-up-container').removeClass('hide').child(0).addClass('pop-up-anim');
  }, (i, maxlength) => {
    $('#pop-up').text(`${langFile[configFile.lang].alerts.newSongsFound}${i} / ${maxlength}`);

    if (i === maxlength) {
      // hide pop-up
      $('#pop-up-container').addClass('hide').child(0).removeClass('pop-up-anim');
      window.location.reload(true);
    }
  });
}

function clickBtnControls() {
  $(this).addClass('click-controls')
    .on({
      animationend: function () {
        $(this).removeClass('click-controls');
      }
    });

  if (listSongs.length !== 0) {
    switch (this.id) {
      case 'play-pause':
        if (PLAYER.controls.playSong() === 'resume') {
          // Send a message to the thumbar buttons [Windows]
  // //         if (process.platform) ipcRenderer.send('thumb-bar-update', 'pauseMomment');
        } else {
          // Send a message to the thumbar buttons [Windows]
  // //         if (process.platform) ipcRenderer.send('thumb-bar-update', 'playMomment');
        }
        break;
      case 'next': PLAYER.controls.nextSong(); break;
      case 'prev': PLAYER.controls.prevSong(); break;
      case 'shuffle': PLAYER.controls.shuffle() ;break;
    }
  } else {
      dialog.showMessageBox({
        type: 'info',
        buttons: ['Ok'],
        message: lang.alerts.error_002
      });
  }
}

/** --------------------------------------- Events --------------------------------------- **/
// Scrolling the list of songs
$('#song-title').on({
  click: function () {
    if (this.children[0].textContent.trim() !== '') {
      clickedElement = document.getElementById('list-songs');
      positionElement = document.getElementById($(this).data('position'));
      const ELEMENT = clickedElement.scrollTop;
      const TOP = positionElement.offsetTop;
      const TOPNAV = Math.round(document.getElementById('top-nav').offsetHeight);
      const DISTANCE = TOP - (TOPNAV + 100);
      clickedElement.scrollTop += ELEMENT !== DISTANCE ? DISTANCE - ELEMENT : - (DISTANCE - ELEMENT);
    }
  }
});

// Choose an option to search by: (new feature)
// - Song
// - Artist
// - Album
// $('#searchBy').on({ change: function () { searchBy = this.value; } });

// Open the window configuration
$('#config').on({ click: () => { ipcRenderer.send('show-config'); } });

// Action when do click on over the buttons play, next, prev and shuffle
$('.btn-controls').on({ click: clickBtnControls });

// step forward or step back the song using the progress bar
$('#total-progress-bar').on({ click: function (e) { PLAYER.controls.moveForward(e, this); } });

// Action over the pagination
$('.arrow').on({
  click: function () {
    if (this.id === 'right-arrow' && $(this).has('arrow-open-anim')) {
      if (countSlide < tempSlide) ++countSlide;
    } else if (this.id === 'left-arrow' && $(this).has('arrow-open-anim')) {
      if (countSlide < tempSlide && countSlide > 0) --countSlide;
    }

    if (countSlide === tempSlide - 1) $('#right-arrow').removeClass('arrow-open-anim');
    if (countSlide === 1) $('#left-arrow').addClass('arrow-open-anim');
    if (countSlide === 0) $('#left-arrow').removeClass('arrow-open-anim');
    if (countSlide === tempSlide - 2) $('#right-arrow').addClass('arrow-open-anim');
    if (countSlide < tempSlide && countSlide !== -1) {
      $('#wrapper-results').child()
      .css(`transform:translateX(${-1 * (countSlide * document.body.clientWidth)}px)`);
    }
  }
});

/** --------------------------------------- Ipc Renderers --------------------------------------- **/
// Close the searching bar
ipcRenderer.on('close-search-song', () => { if (isSearchDisplayed) hideSearchInputData(); });

// Display the searching bar [ctrl + F]
ipcRenderer.on('search-song', () => {
  if (!isSearchDisplayed) {
    $('#search-container').removeClass('hide');
    $('#search-wrapper').addClass('search-wrapper-anim');
    $($('.grid-container').get(0)).css('-webkit-filter:blur(1px)');
    $('#wrapper-results').empty();
    $('#search').addClass('search-anim')
    .on({ keyup: searchInputData }).val('').get().focus();
    isSearchDisplayed = true;
    countSlide = 0;

    let resizeTimes;
    window.onresize = function() {
      clearTimeout(resizeTimes);
      resizeTimes = setTimeout(() => {
        $('#wrapper-results')
        .css(`width:${tempSlide * document.body.clientWidth}px`);
        $('.results').css(`width:${document.body.clientWidth}px`);
      }, 160);
    };
  }
});

// Send the values from the equalizer to the AudioContext [player/controls/index.js]
ipcRenderer.on('get-equalizer-filter', (e, a) => {
  PLAYER.controls.setFilterVal(...a);
});

// Make the list of song when are exported from the config panel (adding the music folder)
ipcRenderer.on('order-display-list', () => {
  window.location.reload(true);
});

// Play or pause song [Ctrl + Up]
ipcRenderer.on('play-and-pause-song', PLAYER.controls.playSong);

// Next song [Ctrl + Right]
ipcRenderer.on('next-song', PLAYER.controls.nextSong);

// Prev song [Ctrl + Left]
ipcRenderer.on('prev-song', PLAYER.controls.prevSong);

// Shuffle [Ctrl + Down]
ipcRenderer.on('shuffle', PLAYER.controls.shuffle);

// // // ThumbarButtons [Windows]
// // ipcRenderer.on('thumbar-controls', (e, a) => {
// //   controlsActions(a);
// // });