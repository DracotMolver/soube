/**
 * @module main.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * This file acts like a main controller where we define events over the music player
 * and displays all the needed stuffs to makes it work.
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

// ---- searching bar ----
let isToggledButtons = false

// Enable shuffle
if (configFile.shuffle)
    $('#shuffle-icon').css('fill:var(--whiteColor)')

if ($('@objSize')(listSongs)) { // When the songs are loaded
    player.createView(player)
    // menu.folders.checkListOfSongs()
} else { // When there'are no song to load
    $('#list-songs')
        .text(`<div id="init-message">${lang.alerts.welcome}</div>`)
        .on({ click: menu.folders.loadFolder })
}

/** --------------------------------------- Functions --------------------------------------- **/
// TODO: Check if there's a new version to download
// require('./version')(remote.net, remote.app.getVersion(), function (response) {
//     console.log(response)
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
// })

/**
 * Hides the searching bar
 */
function hideSearchInputData() {
    $('#search-container').addClass('hide')
    $('#m-search-wrapper').addClass('hide')
    $('#search-wrapper').switchClass('search-wrapper-anim', 'hide')
    $('#wrapper-results').empty()
    $('#main-parent-container').rmAttr('style')
    $('#leftright').addClass('hide')

    isSearchDisplayed = false
}

/**
 * Play the song that has been clicked in the result of searching
 */
function btnPlaySong() {
    hideSearchInputData()
    player.getMediaControl(player.mediaControl()).playSongAtPosition($(this).data('position'))
}

/**
 * Actions over the play, netxt, prev and shuffle buttons
 * @param {string} action - Which button of the player is being clicked. values:[paly-pause|next|prev|shuffle]
 */
function btnActions(action) {
    switch (action) {
        case 'play-pause': player.getMediaControl(player.mediaControl()).playSong(); break
        case 'next': player.getMediaControl(player.mediaControl()).nextSong(); break
        case 'prev': player.getMediaControl(player.mediaControl()).prevSong(); break
        case 'shuffle': player.getMediaControl(player.mediaControl()).setShuffle(); break
    }
}

/**
 * Add animations to the play, next, prev and shuffle buttons
 */
function clickBtnControls() {
    listSongs.length ? btnActions(this.id)
        : ipcRenderer.send('display-msg', {
            type: 'info',
            message: lang.alerts.error_002,
            detail: '',
            buttons: ['Ok']
        })
}

/**
 * Scrolling the list of songs using the arrows.
 * @param {string} direction - The array which is being clicked. values:[up|down]
 */
function scrollAnimation(direction) {
    const animation = function () {
        $('#list-songs').get().scrollTop += direction === 'up' ? -(3.6) : 3.6

        interval = requestAnimationFrame(animation)
    }
    interval = requestAnimationFrame(animation)
}

/**
 * Closes all the config modals
 */
function closeModals() {
    ipcRenderer.send('open-specific-key', 'Space')
    $('#main-parent-container').rmAttr('style')
    $('.parent-container-config')
        .addClass('hide')
        .each(function (v) {
            $(v).child(0).removeClass('container-config-anim')
        })

    // Clean all the used variables for all the config modals
    menu.folders.close()
    menu.equalizer.close()
    menu.preferences.configurations.close()
    if (player.mediaControl() === 'album')
        menu.folders.albumFolder.closeAlbum()

    isModalOpen = false
}

/**
 * Displays any modal from the option menu.
 * @param {function} fn - The function to execute and displays the correspond modal
 */
function isModalOpened(fn) {
    if (!isModalOpen) {
        fn() 
        $('.warning').text('')
        isModalOpen = true
        ipcRenderer.send('close-specific-key', {
            keyName: 'Space',
            keepUnregistered: true
        })
    }
}

/** --------------------------------------- Events --------------------------------------- **/
// TODO: this must be change for a better option
window.onresize = function () {
    if (document.body.offsetWidth > 580) {
        const topNav = $('#top-nav').child()
        $(topNav.get(0)).rmAttr('style')
        $(topNav.get(1)).rmAttr('style')
    }

    if (isSearchDisplayed)
        hideSearchInputData()
}

// Takes us till the song is playing now
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

// Scrolling the list of songs like it was the scrollbar of the browser
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

// Step forward or step back the song using the progress bar (time lapse)
$('#total-progress-bar').on({
    click: function (e) {
        player.getMediaControl(player.mediaControl()).moveForward(e, this)
    }
})

// Slides of searched songs [Desktop]
$('.arrow-leftright').on({ click: player.search.animSlideSongs })

// Event to close all the config modals
$('.close').on({ click: closeModals })

// The width value to decide if it is mobile or not, are on the unsemantic.css framework
// The searching bar when the width of the windows is for desktop device
$('#search').on({
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

// The searching bar when the width of the windows is for mobile device
$('#m-search').on({
    keyup: function () {
        player.search.searchMobileResults(
            player.search.getValuesFromList(this.value, listSongs),
            btnPlaySong
        )
    },
    animationend: function () { this.focus() }
})

// Will hide and show the buttons when the music player is resonsive
$('#toggle-buttons').on({
    click: function () {
        const topNav = $('#top-nav').child()
        const w = document.body.offsetWidth
        let mL = 0
        let l = 0

        if (w < 580 && w > 321) {
            ml = isToggledButtons ? -20 : 0
            l = isToggledButtons ? 1 : 21
        } else if (w < 320) {
            ml = isToggledButtons ? -40 : 0
            l = isToggledButtons ? 2 : 42
        }

        $(topNav.get(0)).css(`margin-left:${ml}%!important`)
        $(topNav.get(1)).css(`left:${l}%`)

        isToggledButtons = !isToggledButtons
    }
})

// $('#filter-container').on({
//     click: function () {
//         $('#list-songs').addClass('anim-list-song')
//     }
// })

/** --------------------------------------- Ipc Renderers --------------------------------------- **/
// Close the searching bar and all the config modals
// Just one modal can be displays at a time
// This function is also for the searching bar, which is not a modal
// but is displayed like any modal.
ipcRenderer.on('close-search-song', function () {
    if (isSearchDisplayed)
        hideSearchInputData() // Searching bar

    closeModals()
})

// Displays the searching bar [ctrl + F]
ipcRenderer.on('search-song', function () {
    // It is only displayed when any modal hasn't been displayed and we are playing
    // our list of songs and we are not using the album view option.
    if (!isSearchDisplayed && !isModalOpen && player.mediaControl() === 'player' &&
        !menu.preferences.configurations.isResized()) {
        $('#search-container').removeClass('hide')
        $('#main-parent-container').css('-webkit-filter:blur(1px)')

        player.search.reset()
        player.search.setWidthContainer(parseInt($('#container-results').cssValue('width')))

        if (document.body.clientWidth <= 768) {
            $('#m-search-wrapper').removeClass('hide')
            $('#m-search').addClass('search-anim').val('')
            $('#wrapper-results').rmAttr('style')
        } else {
            $('#search-wrapper').switchClass('hide', 'search-wrapper-anim')
            $('#search').addClass('search-anim').val('')
        }

        isSearchDisplayed = true
        // We unregister the Space keyword beacuase it's register to do play.
        // But the space bar is needed to type white spaces and not to play,
        // because we are searching.
        ipcRenderer.send('close-specific-key', {
            keyName: 'Space',
            keepUnregistered: true
        })
    }
})

// Sends the values from the equalizer to the AudioContext [player/controls/index.js]
ipcRenderer.on('get-equalizer-filter', function (e, a) {
    player.getMediaControl(player.mediaControl()).setFilterVal(...a)
})

// Plays or pause song [Space]
ipcRenderer.on('play-and-pause-song', function () {
    if (listSongs.length && $('#spinner').has('hide'))
        player.getMediaControl(player.mediaControl()).playSong()
})

// Next song [Ctrl + Right]
ipcRenderer.on('next-song', function () {
    if (listSongs.length && $('#spinner').has('hide'))
        player.getMediaControl(player.mediaControl()).nextSong()
})

// Prev song [Ctrl + Left]
ipcRenderer.on('prev-song', function () {
    if (listSongs.length && $('#spinner').has('hide'))
        player.getMediaControl(player.mediaControl()).prevSong()
})

// Shuffle [Ctrl + Down]
ipcRenderer.on('shuffle', function () {
    if ($('#spinner').has('hide'))
        player.getMediaControl(player.mediaControl()).setShuffle()
})

// ThumbarButtons [Windows]
ipcRenderer.on('thumbar-controls', function (e, a) {
    btnActions(a)
})

// Because the requestAnimationFrame is single thread in the window,
// We must save the actual time lapse when we minimized the Window
// and then recalculate the time when we unminimized the window.
ipcRenderer.on('save-current-time', function () {
    player.getMediaControl(player.mediaControl()).saveCurrentTime()
})
ipcRenderer.on('update-current-time', function () {
    player.getMediaControl(player.mediaControl()).updateCurrentTime()
})

// Displays the windows to add a musics folders [Ctrl + N]
ipcRenderer.on('menu-add-folder', function () {
    if (!menu.preferences.configurations.isResized())
        isModalOpened(menu.folders.loadFolder)
})

// Displaya the album to be played [Ctrl + Shift + A]
ipcRenderer.on('menu-play-album', function () {
    if (!menu.preferences.configurations.isResized())
        isModalOpened(menu.folders.albumFolder.loadFullAlbum)
})

// Displays the equalizer [Ctrl + E]
ipcRenderer.on('menu-equalizer', function () {
    if (!menu.preferences.configurations.isResized())
        isModalOpened(menu.equalizer.showEqualizer)
})

// Displays the configurations [Ctrl + O]
ipcRenderer.on('menu-configurations', function () {
    if (!menu.preferences.configurations.isResized())
        isModalOpened(menu.preferences.configurations.showConfigurations)
})

// Displays info about Soube
ipcRenderer.on('menu-about', function () {
    if (!menu.preferences.configurations.isResized())
        isModalOpened(menu.preferences.about)
})
