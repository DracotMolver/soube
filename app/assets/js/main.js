/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/** --------------------------------------- Modules --------------------------------------- **/
//---- Electron ----
const {
  ipcRenderer,
  remote,
  shell
} = require('electron');

//---- Own ----
const preferences = require('./menu/preferences');
const equalizer = require('./menu/equalizer');
const version = require('./version');
const folders = require('./menu/folders');
const player = require('./player');
const {
  configFile,
  listSongs,
  langFile
} = require('./config').init();
const $ = require('./dom');

/** --------------------------------------- Variables --------------------------------------- **/
//---- constants ----
const timeScrolling = 3.6;
const maxElements = 20;
const lapsePopup = 4500;

let lang = langFile[configFile.lang];
let interval = 0;

//---- scrolling element ----
let clickedElement = null;
let positionElement = null;

//---- searching bar ----
let regex = null;

let isSearchDisplayed = false;
let isModalOpen = false;

let totalResults = 0;
let countSlide = 0;
let countItem = 0;
let totalItem = 0;
let stepItem = 0;
let slide = 0;

let newList = [];
let list = [];

let oldSearchedValue = '';
let searchValue = '';

let parentSlideItem = $(document.createElement('div')).addClass('grid-25 mobile-grid-25').get();
let containerSlider = $(document.createElement('div')).addClass('results');
let slideContainer = document.createDocumentFragment();
let itemSlide = document.createDocumentFragment();

/** --------------------------------------- Functions --------------------------------------- **/
// Check if there's a new version to download
function getActualVersion() {
  version(remote.net, remote.app.getVersion(), function (response) {
    if (response === 'major') {
      $('#pop-up-container')
        .removeClass('hide')
        .child(0)
        .addClass('pop-up-anim')
        .text(`<a href="http://soube.diegomolina.cl">${lang.alerts.newVersion}</a>`);

      $(':a').on({
        click: function (e) {
          e.preventDefault();
          shell.openExternal(this.href);
        }
      });

      let tout = setTimeout(function () {
        $('#pop-up-container')
          .addClass('hide')
          .child(0)
          .removeClass('pop-up-anim');

        clearTimeout(tout);
      }, lapsePopup);
    }
  });
}

// Main function!!
function loadSongs() {
  // Enable shuffle
  if (configFile.shuffle) $('#shuffle-icon').css('fill:var(--lightPinkColor)');

  // getActualVersion();

  if (Object.keys(listSongs).length) {
    // Render the list of songs
    player.createView(player);
    // checkNewSongs();
  } else {
    $('#list-songs')
      .text(`<div id="init-message">${lang.alerts.welcome}</div>`)
      .on({
        click: function () {
          folders.loadFolder();
        }
      });
  }
}
loadSongs();

// Hide the searching bar
function hideSearchInputData() {
  $('#search-container').addClass('hide');
  $('#search-wrapper').removeClass('search-wrapper-anim');
  $($('.grid-container').get(0)).rmAttr('style');

  isSearchDisplayed = false;
}

// Play the song clicked in the search results
function btnPlaySong() {
  hideSearchInputData();
  player.getMediaControl(player.mediaControl).playSongAtPosition($(this).data('position'));
}

// Will be executed every time the user hit down a keyword
// So, I carefully tried to code a clean and faster code :).
function searchInputData(e) {
  containerSlider.css(`width:${document.body.clientWidth - 100}px`);

  $('#wrapper-results').empty();
  $('#leftright').addClass('hide');

  searchValue = this.value.trim();

  if (searchValue !== '') {
    regex = new RegExp(searchValue.replace(/\s/g, '\&nbsp;').trim(), 'ig');

    if (newList.length && searchValue.length > oldSearchedValue.length) {
      list = newList.filter(function (v) {
        return regex.test(v.title);
      });
    } else {
      oldSearchedValue = searchValue;
      newList = list = listSongs.filter(function (v) {
        return regex.test(v.title);
      });
    }

    // Show possibles results
    totalResults = list.length;
    countSlide = slide = totalResults > maxElements ? Math.round(totalResults / maxElements) : 1;

    if (list.length) {
      countItem = 0;
      while (slide--) {
        totalItem = totalResults - countItem > maxElements ? maxElements : totalResults - countItem;
        for (stepItem = 0; stepItem < totalItem; stepItem++ , countItem++) {
          itemSlide.appendChild(
            $(parentSlideItem.cloneNode(false))
              .text(`<div class="search-results">${list[countItem].title}</div>`)
              .data({ position: list[countItem].position })
              .on({ click: btnPlaySong }).get()
          );
        }

        slideContainer.appendChild(
          $(containerSlider.get()
            .cloneNode(false))
            .append(itemSlide).get()
        );
        itemSlide = document.createDocumentFragment();
      }
    }

    // Display all the filtered songs
    $('#wrapper-results')
      .empty()
      .append(slideContainer)
      .removeClass('no-searching-found')
      .css(`width:${countSlide * (document.body.clientWidth - 100)}px`);

    slideContainer = document.createDocumentFragment();
  } else {
    // Clean if there's no coincidence
    $('#wrapper-results')
      .text(lang.alerts.searchingResults)
      .addClass('no-searching-found');
  }
}

// Check if there are new songs to be added
// function checkNewSongs() {
// //   player.addSongFolder(configFile.musicFolder, () => {
// //     // show pop-up
// //     $('#pop-up-container').removeClass('hide').child(0).addClass('pop-up-anim');
// //   }, (i, maxlength) => {
// //     $('#pop-up').text(`${langFile[configFile.lang].alerts.newSongsFound}${i} / ${maxlength}`);

// //     if (i === maxlength) {
// //       // hide pop-up
// //       $('#pop-up-container').addClass('hide').child(0).removeClass('pop-up-anim');
// //       // remote.getCurrentWindow().reload();
// //     }
// //   });
// }

// Actions over the play, netxt, prev and shuffle buttons
function btnActions(action) {
  switch (action) {
    case 'play-pause': player.getMediaControl(player.mediaControl).playSong(); break;
    case 'next': player.getMediaControl(player.mediaControl).nextSong(); break;
    case 'prev': player.getMediaControl(player.mediaControl).prevSong(); break;
    case 'shuffle': player.getMediaControl(player.mediaControl).setShuffle(); break;
  }
}

// Add animations to the play, next, prev and shuffle buttons
function clickBtnControls() {
  $(this).addClass('click-controls')
    .on({
      animationend: function () {
        $(this).removeClass('click-controls');
      }
    });

  listSongs.length ? btnActions(this.id) :
    ipcRenderer.send('display-msg', {
      type: 'info',
      message: lang.alerts.error_002,
      detail: '',
      buttons: ['Ok']
    });
}

// Scroll the list of songs using the arrows
function scrollAnimation(direction) {
  const animation = function () {
    $('#list-songs').get().scrollTop +=
      direction === 'up' ? -(timeScrolling) : timeScrolling;

    interval = requestAnimationFrame(animation);
  };
  interval = requestAnimationFrame(animation);
}

// Close the config modals
function closeModals() {
  $($('.grid-container').get(0)).rmAttr('style');
  $('.parent-container-config')
    .addClass('hide')
    .each(function (v) {
      $(v).child(0).removeClass('container-config-anim');
    });

  // Clean all the used variables by the config panels
  $('.warning').empty();
  folders.close();
  equalizer.close();
  preferences.configurations.close();

  isModalOpen = false;
}

// Display anay modal from the menu option
function isModalOpened(fc) {
  if (!isModalOpen) {
    fc();
    isModalOpen = true;
  }
}

/** --------------------------------------- Events --------------------------------------- **/
// Scrolling the list of songs when click on the song title
$('#song-title').on({
  click: function () {
    if (this.children[0].textContent.trim() !== '') {
      clickedElement = $('#list-songs').get();
      positionElement = $(`#${$(this).data('position')}`).get();

      const element = clickedElement.scrollTop;
      const top = positionElement.offsetTop;
      const distance = top - (Math.round($('#top-nav').get().offsetHeight) + 100);
      const _c = distance - element;
      clickedElement.scrollTop += element !== distance ? _c : -(_c);
    }
  }
});

// Scrolling the list of songs like it was the barscroll
// of the browser
$('.arrow-updown').on({
  mousedown: function () {
    scrollAnimation($(this).data('direction'));
  },
  mouseup: function () {
    cancelAnimationFrame(interval);
  }
});

// Actions over the buttons play, next, prev and shuffle
$('.btn-controls').on({ click: clickBtnControls });

// Step forward or step back the song using the progress bar
$('#total-progress-bar').on({
  click: function (e) {
    player.getMediaControl(player.mediaControl).moveForward(e, this);
  }
});

// Close the album player
$('#close-album').on({
  click: function () {
    folders.albumFolder.closeAlbum();
    isModalOpen = false;
  }
});

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

// Event to close all the config modals
$('.close').on({
  click: function () {
    closeModals();
  }
});

/** --------------------------------------- Ipc Renderers --------------------------------------- **/
// Close the searching bar and all the config modals
ipcRenderer.on('close-search-song', function () {
  if (isSearchDisplayed) hideSearchInputData(); // Searching bar
  closeModals();
});

// Display the searching bar [ctrl + F]
ipcRenderer.on('search-song', function () {
  if (!isSearchDisplayed && player.mediaControl === 'player') {
    $('#search-container').removeClass('hide');
    $('#search-wrapper').addClass('search-wrapper-anim');
    $($('.grid-container').get(0)).css('-webkit-filter:blur(1px)');
    $('#container-results').css(`width:${document.body.clientWidth - 100}px`);
    $('#wrapper-results').empty();
    $('#search').addClass('search-anim')
      .on({
        keyup: searchInputData,
        animationend: function () {
          this.focus();
        }
      }).val('').get();

    isSearchDisplayed = true;

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
ipcRenderer.on('get-equalizer-filter', function (e, a) {
  player.getMediaControl(player.mediaControl).setFilterVal(...a);
});

// Play or pause song [Ctrl + Up]
ipcRenderer.on('play-and-pause-song', function () {
  if (listSongs.length)
    player.getMediaControl(player.mediaControl).playSong();
});

// Next song [Ctrl + Right]
ipcRenderer.on('next-song', function () {
  if (listSongs.length)
    player.getMediaControl(player.mediaControl).nextSong();
});

// Prev song [Ctrl + Left]
ipcRenderer.on('prev-song', function () {
  if (listSongs.length)
    player.getMediaControl(player.mediaControl).prevSong();
});

// Shuffle [Ctrl + Down]
ipcRenderer.on('shuffle', function () {
  player.getMediaControl(player.mediaControl).setShuffle();
});

// ThumbarButtons [Windows]
ipcRenderer.on('thumbar-controls', function (e, a) {
  btnActions(a);
});

// Because the requestAnimationFrame is single thread in the window
// We must save the actual time lapse when we minimized the Window
// and then recalculate the time when we unminimized the window.
ipcRenderer.on('save-current-time', function () {
  player.getMediaControl(player.mediaControl).saveCurrentTime();
});
ipcRenderer.on('update-current-time', function () {
  player.getMediaControl(player.mediaControl).updateCurrentTime();
});

// Display the windows to add a musics folders [Ctrl + N]
ipcRenderer.on('menu-add-folder', function () {
  isModalOpened(folders.loadFolder);
});

// Display the album to be played [Ctrl + A]
ipcRenderer.on('menu-play-album', function () {
  isModalOpened(folders.albumFolder.loadFullAlbum);
});

// Display the equalizer [Ctrl + E]
ipcRenderer.on('menu-equalizer', function () {
  isModalOpened(equalizer.showEqualizer);
});

// Display the configurations panel [Ctrl + O]
ipcRenderer.on('menu-configurations', function () {
  isModalOpened(preferences.configurations.showConfigurations);
});

// Display info about Soube
ipcRenderer.on('menu-about', function () {
  isModalOpened(preferences.about.showAbout);
});