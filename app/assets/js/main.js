/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/** --------------------------------------- Modules --------------------------------------- **/
//---- Electron ----
const {
  ipcRenderer,
  remote
} = require('electron');

//---- Own ----
const PLAYER = require('./factory')('player');
const version = require('./version');
const config = require('./config');
const menuAddFolder = require('./menu/menuAddFolder.js');
const {
  configFile,
  langFile,
  listSongs
} = config.init();
require('./dom');

/** --------------------------------------- Variables --------------------------------------- **/
//---- constants ----
const TIME_SCROLLING = 3.2; // Pixels per frame
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
let interval = 0;

//---- scrolling element ----
let clickedElement = null; // When you do click on the name of the song
let positionElement = null; // Where is the song that you clicked on.

//---- searching input ----
let isSearchDisplayed = false; // Checks if it was launched the searching bar
let totalResults = 0; // Amount of songs filtered
let searchValue = ''; // The input text to search for
// let fragmentSlide = null; // DocumentFragment() slide container
// let countSlide = 0;
let countItem = 0;
let itemSlide = [];
let fragmentItems = null; // DocumentFragment() button container
let slide = 0; // Amount of slides to make
let regex = null; // The name of the song to search for as a regular expression
let list = []; // Filtered songs.
let searchBy = 'title';
// let newList = []; // Old filters songs
// let oldSearchedValue = ''; // The prev song that is being searching for

/** --------------------------------------- Functions --------------------------------------- **/
// Check if there's a new version to download
function getActualVersion() {
  version(remote.net, remote.app.getVersion(), response => {
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
    // checkNewSongs();
  }
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

// This function will makes the HTML items songs for the slides
function makeItemSlide() {
  /**
   * HTML structure
   *
   * <div class="grid-25 mobile-grid-25">
   *  <div class="search-results">
   *    title of the song
   *  </div>
   * </div>
   */
  itemSlide = [];
  listSongs.forEach(v => {
    itemSlide.push(
      BTN_FILTER_SONGS[0].clone(true) // <div class="grid-25 mobile-grid-25">
      .insert(
        BTN_FILTER_SONGS[1].clone(true) // <div class="search-results">
        .text(v.title)
      )
      .data({ position: v.position })
      .on({
        click: function () {
          PLAYER.controls.playSongAtPosition($(this).data('position'));
          hideSearchInputData();
        }
      }).get()
    );
  });
}

// will be executed every time the user hit down a keyword
// So, I carefully tried to do a clean, cheaper and faster code :).
function searchInputData(e) {
  // Clean if there's no coincidence
  $('#wrapper-results').removeClass('no-searching-found').empty();
  $('#pagination').addClass('hide');

  searchValue = this.value.trim();
  if (searchValue !== '') {
    // countSlide = 0;
    // Complete the text
    if (e.key === 'ArrowRight' && searchValue.length > 1)
      this.value = $('#search-result').text();

    regex = new RegExp(`${searchValue.replace(/\s+/g, '&nbsp;')}`, 'ig');

    // if (newList.length > 0) {
    //   console.log(newList.length);
    // } else {
    //   list = newList.filter(v => regex.test(v[searchBy]));
    //   oldSearchedValue = searchValue;
    //   newList = list;
    // } else {
    // console.log('qwer')
      list = itemSlide.filter(v => regex.test(v.textContent));
    //   oldSearchedValue = searchValue;
    //   newList = list;
    // }

    if (e.key === 'Enter') {
      PLAYER.controls.playSongAtPosition($(list[list.length - 1]).data('position'));
      hideSearchInputData();
    }

    // Show possibles results
    totalResults = list.length - 1;
    slide = totalResults > MAX_ELEMENTS ? Math.round(totalResults / MAX_ELEMENTS) : 1;
    // Add the pagination if there's more than one slide
    slide > 1 ?
      $('#pagination').removeClass('hide').child(1).addClass('arrow-open-anim') :
      $('#pagination').addClass('hide');
    
    // fragmentSlide = fragmentItems = document.createDocumentFragment();
    // Make an slide with all the filtered coincidences
    // const FILTERED_SONGS = totalResults < MAX_ELEMENTS ? this.length : MAX_ELEMENTS;
    if (list.length > 0) {
      var i = 0;
      var size = 0;
      while (slide--) {
        countItem = 0;
        size = totalResults - countItem > 20 ? 20 : totalResults - countItem;
        i = (size = slide * size) - size;
        for (; i < size; i++, countItem++) {
    //       fragmentItems.appendChild(
    //         BTN_FILTER_SONGS[0].clone(true)
    //         .insert(
    //           BTN_FILTER_SONGS[1].clone(true)
    //           .text(list[totalResults][searchBy])
    //         )
    //         .data({ position: list[totalResults].position })
    //         .on({
    //           click: function() {
    //             selectedSong($(this).data('position'));
    //           }
    //         }).get()
          // );
        }

    //     // All the buttons into the slides
    //     fragmentSlide.appendChild(
    //       BTN_FILTER_SONGS[2].clone(true)
    //       .insert(fragmentItems)
    //       .css(`width:${document.body.clientWidth}px`).get()
    //     );
    //     fragmentItems = document.createDocumentFragment();
      }

    //   // Display all the filtered songs
    //   $('#wrapper-results').empty()
    //   .insert(fragmentSlide)
    //   .css(`width:${tempSlide * document.body.clientWidth}px`);

    } else {
      // Clean if there's no coincidence
      $('#wrapper-results')
      .text(lang.alerts.searchingResults)
      .addClass('no-searching-found');
      $('#pagination').addClass('hide');
    }
  }

  // Show the first coincidence to show as a "ghost text".
  // $('#search-result').text(list.length > 0 && searchValue !== '' ? list[list.length - 1][searchBy] : '');
}

// Check if there are new songs to be added
// function checkNewSongs() {
//   PLAYER.addSongFolder(configFile.musicFolder, () => {
//     // show pop-up
//     $('#pop-up-container').removeClass('hide').child(0).addClass('pop-up-anim');
//   }, (i, maxlength) => {
//     $('#pop-up').text(`${langFile[configFile.lang].alerts.newSongsFound}${i} / ${maxlength}`);

//     if (i === maxlength) {
//       // hide pop-up
//       $('#pop-up-container').addClass('hide').child(0).removeClass('pop-up-anim');
//       // remote.getCurrentWindow().reload();
//     }
//   });
// }

function btnActions(action) {
  switch (action) {
    case 'play-pause':
      if (PLAYER.controls.playSong() === 'resume') {
        if (process.platform === 'win32') ipcRenderer.send('thumb-bar-update', 'pauseMomment');
      } else {
        if (process.platform === 'win32') ipcRenderer.send('thumb-bar-update', 'playMomment');
      }
      break;
    case 'next': PLAYER.controls.nextSong(); break;
    case 'prev': PLAYER.controls.prevSong(); break;
    case 'shuffle': PLAYER.controls.shuffle() ;break;
  }
}

function clickBtnControls() {
  $(this).addClass('click-controls')
  .on({
    animationend: function () {
      $(this).removeClass('click-controls');
    }
  });

  if (listSongs.length) {
    btnActions(this.id);
  } else {
    ipcRenderer.send('display-msg', {
      type: 'info',
      message: lang.alerts.error_002,
      detail: '',
      buttons: ['Ok']
    })
  }
}

function scrollAnimation(direction) {
  const ANIMATION = () => {
    $('#list-songs').get().scrollTop +=
      direction === 'up' ? -(TIME_SCROLLING) : TIME_SCROLLING;

    interval = requestAnimationFrame(ANIMATION);
  };
  interval = requestAnimationFrame(ANIMATION);
}

/** --------------------------------------- Events --------------------------------------- **/
// Scrolling the list of songs
$('#song-title').on({
  click: function () {
    if (this.children[0].textContent.trim() !== '') {
      clickedElement = $('#list-songs').get();
      positionElement = $(`#${$(this).data('position')}`).get();
      const ELEMENT = clickedElement.scrollTop;
      const TOP = positionElement.offsetTop;
      const DISTANCE = TOP - (Math.round($('#top-nav').get().offsetHeight) + 100);
      clickedElement.scrollTop += ELEMENT !== DISTANCE ? DISTANCE - ELEMENT : - (DISTANCE - ELEMENT);
    }
  }
});

// Scrolling the list of songs like it was the barscroll
// of the browser
$('.arrow-updown').on({
  mousedown: function () {
    scrollAnimation($(this).data('direction'));
  },
  mouseup: () => {
    cancelAnimationFrame(interval);
  }
});

// Choose an option to search by: (new feature)
// - Song
// - Artist
// - Album
// $('#searchBy').on({ change: function () { searchBy = this.value; } });

// Open the window configuration
// $('#config').on({ click: () => { ipcRenderer.send('show-config'); } });

// Action when do click on over the buttons play, next, prev and shuffle
$('.btn-controls').on({ click: clickBtnControls });

// step forward or step back the song using the progress bar
$('#total-progress-bar').on({ click: function (e) { PLAYER.controls.moveForward(e, this); } });

// Action over the pagination
// $('.arrow').on({
//   click: function () {
//     if (this.id === 'right-arrow' && $(this).has('arrow-open-anim')) {
//       if (countSlide < tempSlide) ++countSlide;
//     } else if (this.id === 'left-arrow' && $(this).has('arrow-open-anim')) {
//       if (countSlide < tempSlide && countSlide > 0) --countSlide;
//     }

//     if (countSlide === tempSlide - 1) $('#right-arrow').removeClass('arrow-open-anim');
//     if (countSlide === 1) $('#left-arrow').addClass('arrow-open-anim');
//     if (countSlide === 0) $('#left-arrow').removeClass('arrow-open-anim');
//     if (countSlide === tempSlide - 2) $('#right-arrow').addClass('arrow-open-anim');
//     if (countSlide < tempSlide && countSlide !== -1) {
//       $('#wrapper-results').child()
//       .css(`transform:translateX(${-1 * (countSlide * document.body.clientWidth)}px)`);
//     }
//   }
// });

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
    // countSlide = 0;

    // Make the HTML structure of the items in the slide.
    // this will help us to save resources because we will append, as text, the
    // HTML already made.
    makeItemSlide();
    // let resizeTimes;
    // window.onresize = function() {
    //   clearTimeout(resizeTimes);
    //   resizeTimes = setTimeout(() => {
    //     $('#wrapper-results')
    //     .css(`width:${tempSlide * document.body.clientWidth}px`);
    //     $('.results').css(`width:${document.body.clientWidth}px`);
    //   }, 160);
    // };
  }
});

// Send the values from the equalizer to the AudioContext [player/controls/index.js]
ipcRenderer.on('get-equalizer-filter', (e, a) => {
  PLAYER.controls.setFilterVal(...a);
});

// Play or pause song [Ctrl + Up]
ipcRenderer.on('play-and-pause-song', () => {
  if (listSongs.length) PLAYER.controls.playSong
});

// Next song [Ctrl + Right]
ipcRenderer.on('next-song', () => {
  if (listSongs.length) PLAYER.controls.nextSong
});

// Prev song [Ctrl + Left]
ipcRenderer.on('prev-song', () => {
  if (listSongs.length) PLAYER.controls.prevSong
});

// Shuffle [Ctrl + Down]
ipcRenderer.on('shuffle', PLAYER.controls.shuffle);

// ThumbarButtons [Windows]
ipcRenderer.on('thumbar-controls', (e, a) => { btnActions(a); });

// Because the requestAnimationFrame is single thread in the window
// We must save the actual time lapse when we minimized the Window
// and then recalculate the time when we unminimized the window.
ipcRenderer.on('save-current-time', PLAYER.controls.saveCurrentTime);
ipcRenderer.on('update-current-time', PLAYER.controls.updateCurrentTime);

// Display the windows to add musics folders
ipcRenderer.on('menu-add-folder', menuAddFolder.loadFolder);