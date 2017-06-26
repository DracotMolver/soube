/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/** --------------------------------------- Modules --------------------------------------- **/
// ---- Electron ----
const {
  ipcRenderer,
  remote,
  shell
} = require('electron')

// ---- Own ----
const menu = require('./menu/menu.js')
const player = require('./player')
const {
  configFile,
  listSongs,
  langFile
} = require('./config').init()
const $ = require('./dom')

/** --------------------------------------- Variables --------------------------------------- **/
let lang = langFile[configFile.lang]
let interval = 0

// ---- scrolling element ----
let positionElement = null
let clickedElement = null

// ---- searching bar ----
let isSearchDisplayed = false
let isModalOpen = false

/** --------------------------------------- Functions --------------------------------------- **/
// Check if there's a new version to download
require('./version')(remote.net, remote.app.getVersion(), function (response) {
  console.log(response)
  // if (response === 'major') {
  //   $('#pop-up-container')
  //     .removeClass('hide')
  //     .child(0)
  //     .addClass('pop-up-anim')
  //     .text(`<a href="http://soube.diegomolina.cl">${lang.alerts.newVersion}</a>`)

  //   $(':a').on({
  //     click: function (e) {
  //       e.preventDefault()
  //       shell.openExternal(this.href)
  //     }
  //   })

  //   let tout = setTimeout(function () {
  //     $('#pop-up-container')
  //       .addClass('hide')
  //       .child(0)
  //       .removeClass('pop-up-anim')

  //     clearTimeout(tout)
  //   }, 4500)
  // }
})

// Main function!!
// Enable shuffle
if (configFile.shuffle)
  $('#shuffle-icon').css('fill:var(--whiteColor)')


if (Object.keys(listSongs).length) {
  // Render the list of songs
  player.createView(player)
  // checkNewSongs();
} else {
  $('#list-songs')
    .text(`<div id="init-message">${lang.alerts.welcome}</div>`)
    .on({ click: menu.folders.loadFolder })
}

// Hide the searching bar
function hideSearchInputData() {
  $('#search-container').addClass('hide')
  $('#m-search-wrapper').addClass('hide')
  $('#search-wrapper').switchClass('search-wrapper-anim', 'hide')
  $('#wrapper-results').empty()
  $('#main-parent-container').rmAttr('style')
  $('#leftright').addClass('hide')

  isSearchDisplayed = false
}

// Play the song clicked in the search results
function btnPlaySong() {
  hideSearchInputData()
  player.getMediaControl(player.mediaControl).playSongAtPosition($(this).data('position'))
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
    case 'play-pause': player.getMediaControl(player.mediaControl).playSong(); break
    case 'next': player.getMediaControl(player.mediaControl).nextSong(); break
    case 'prev': player.getMediaControl(player.mediaControl).prevSong(); break
    case 'shuffle': player.getMediaControl(player.mediaControl).setShuffle(); break
  }
}

// Add animations to the play, next, prev and shuffle buttons
function clickBtnControls() {
  listSongs.length ? btnActions(this.id)
    : ipcRenderer.send('display-msg', {
      type: 'info',
      message: lang.alerts.error_002,
      detail: '',
      buttons: ['Ok']
    })
}

// Scroll the list of songs using the arrows
function scrollAnimation(direction) {
  const animation = function () {
    $('#list-songs').get().scrollTop += direction === 'up' ? -(3.6) : 3.6

    interval = requestAnimationFrame(animation)
  }
  interval = requestAnimationFrame(animation)
}

// Close the config modals
function closeModals() {
  ipcRenderer.send('open-specific-key', 'Space')
  $('#main-parent-container').rmAttr('style')
  $('.parent-container-config')
    .addClass('hide')
    .each(function (v) {
      $(v).child(0).removeClass('container-config-anim')
    })

  // Clean all the used variables by the config panels
  menu.folders.close()
  menu.equalizer.close()
  menu.preferences.configurations.close()

  isModalOpen = false
}

// Display anay modal from the menu option
function isModalOpened(fc) {
  if (!isModalOpen) {
    fc()
    $('.warning').text('')
    isModalOpen = true
    ipcRenderer.send('close-specific-key', {
      keyName: 'Space',
      keepUnregistered: true
    })
  }
}

/** --------------------------------------- Events --------------------------------------- **/
window.onresize = function () {
  if (isSearchDisplayed)
    hideSearchInputData()
}

// Scrolling the list of songs when click on the song title
$('#song-title').on({
  click: function () {
    if (this.children[0].textContent.trim() !== '') {
      clickedElement = $('#list-songs').get()
      positionElement = $(`#${$(this).data('position')}`).get()
      const element = clickedElement.scrollTop
      const distance = positionElement.offsetTop - Math.round($('#top-nav').get().offsetHeight)
      clickedElement.scrollTop += element !== distance ? (distance - element) : -(distance - element)
    }
  }
})

// Scrolling the list of songs like it was the barscroll
// of the browser
$('.arrow-updown').on({
  mousedown: function () {
    scrollAnimation($(this).data('direction'))
  },
  mouseup: function () {
    cancelAnimationFrame(interval)
  }
})

// Actions over the buttons play, next, prev and shuffle
$('.btn-controls').on({ click: clickBtnControls })

// Step forward or step back the song using the progress bar
$('#total-progress-bar').on({
  click: function (e) {
    player.getMediaControl(player.mediaControl).moveForward(e, this)
  }
})

// Close the album player
$('.close-album').on({
  click: function () {
    menu.folders.albumFolder.closeAlbum()
    isModalOpen = false
    ipcRenderer.send('open-specific-key', 'Space')
  }
})

// Will move the slide of searched songs [Desktop]
$('.arrow-leftright').on({ click: player.search.animSlideSongs })

// Event to close all the config modals
$('.close').on({ click: closeModals })

$('#search')
  .on({
    keyup: function () {
      player.search.searchDesktopResults(
        player.search.getValuesFromList(this.value, listSongs),
        btnPlaySong,
        lang
      )
    },
    animationend: function () {
      this.focus()
    }
  })

$('#m-search')
  .on({
    keyup: function () {
      player.search.searchMobileResults(
        player.search.getValuesFromList(this.value, listSongs),
        btnPlaySong,
        lang
      )
    },
    animationend: function () {
      this.focus()
    }
  })

/** --------------------------------------- Ipc Renderers --------------------------------------- **/
// Close the searching bar and all the config modals
ipcRenderer.on('close-search-song', function () {
  if (isSearchDisplayed)
    hideSearchInputData() // Searching bar

  closeModals()
})

// Display the searching bar [ctrl + F]
ipcRenderer.on('search-song', function () {
  if (!isSearchDisplayed && !isModalOpen && player.mediaControl === 'player') {
    $('#search-container').removeClass('hide')
    $('#main-parent-container').css('-webkit-filter:blur(1px)')

    player.search.reset()
    player.search.setWidthContainer(parseInt($('#container-results').cssValue('width')))

    if (document.body.clientWidth <= 768) {
      $('#m-search-wrapper').removeClass('hide')
      $('#m-search').addClass('search-anim').val('')
    } else {
      $('#search-wrapper').switchClass('hide', 'search-wrapper-anim')
      $('#search').addClass('search-anim').val('')
    }

    isSearchDisplayed = true
    ipcRenderer.send('close-specific-key', {
      keyName: 'Space',
      keepUnregistered: true
    })
  }
})

// Send the values from the equalizer to the AudioContext [player/controls/index.js]
ipcRenderer.on('get-equalizer-filter', function (e, a) {
  player.getMediaControl(player.mediaControl).setFilterVal(...a)
})

// Play or pause song [Space]
ipcRenderer.on('play-and-pause-song', function () {
  if (listSongs.length && $('#spinner').has('hide'))
    player.getMediaControl(player.mediaControl).playSong()
})

// Next song [Ctrl + Right]
ipcRenderer.on('next-song', function () {
  if (listSongs.length)
    player.getMediaControl(player.mediaControl).nextSong()
})

// Prev song [Ctrl + Left]
ipcRenderer.on('prev-song', function () {
  if (listSongs.length)
    player.getMediaControl(player.mediaControl).prevSong()
})

// Shuffle [Ctrl + Down]
ipcRenderer.on('shuffle', function () {
  player.getMediaControl(player.mediaControl).setShuffle()
})

// ThumbarButtons [Windows]
ipcRenderer.on('thumbar-controls', function (e, a) {
  btnActions(a)
})

// Because the requestAnimationFrame is single thread in the window
// We must save the actual time lapse when we minimized the Window
// and then recalculate the time when we unminimized the window.
ipcRenderer.on('save-current-time', function () {
  player.getMediaControl(player.mediaControl).saveCurrentTime()
})
ipcRenderer.on('update-current-time', function () {
  player.getMediaControl(player.mediaControl).updateCurrentTime()
})

// Display the windows to add a musics folders [Ctrl + N]
ipcRenderer.on('menu-add-folder', function () {
  isModalOpened(menu.folders.loadFolder)
})

// Display the album to be played [Ctrl + Shift + A]
ipcRenderer.on('menu-play-album', function () {
  isModalOpened(menu.folders.albumFolder.loadFullAlbum)
})

// Display the equalizer [Ctrl + E]
ipcRenderer.on('menu-equalizer', function () {
  isModalOpened(menu.equalizer.showEqualizer)
})

// Display the configurations panel [Ctrl + O]
ipcRenderer.on('menu-configurations', function () {
  isModalOpened(menu.preferences.configurations.showConfigurations)
})

// Display info about Soube
ipcRenderer.on('menu-about', function () {
  isModalOpened(menu.preferences.about)
})
