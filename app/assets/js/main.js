/**
 * @module main.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * This file acts like a main controller where we define events over the music player
 * and displays all the needed stuffs to makes it work.
 */

/** -=================================== Modules ===================================- **/
'use strict'

// ---- Node ----
const path = require('path')

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
const { $ } = require('./dom')

/** -=================================== Variables ===================================- **/
let lang = langFile[configFile.lang]
let interval = 0
let positionElement = null
let clickedElement = null
let isModalOpen = false

// Enable shuffle
if (configFile.shuffle)
    $('#shuffle-icon', { css: 'fill:var(--whiteColor)' })

if ($('@objSize')(listSongs)) { // When the songs are loaded
    player.createView(player)
    // menu.folders.checkListOfSongs()
} else { // When there'are no song to load
    $('#list-songs', {
        text: `<div id="init-message">${lang.alerts.welcome}</div>`,
        on: { click: menu.folders.loadFolder }
    }).focus()
}

/** -=================================== Functions ===================================- **/
/**
 * Check the actual version of the app gainst the one on Github (Released)
 */
const worker = new Worker(path.join(__dirname, 'version', 'workerVersion.js'))
worker.postMessage({
    version: remote.app.getVersion()
})
worker.onmessage = e => {
    if (e.data.version === 'major') {
        $('#pop-up-container', {
            removeClass: 'hide',
            child: 0,
            addClass: 'pop-up-anim',
            text: `<a href="http://soube.diegomolina.cl">${lang.alerts.newVersion}</a>`
        })

        $(':a', {
            on: {
                click(el, e) {
                    e.preventDefault()
                    shell.openExternal(el.href)
                }
            }
        })

        const tout = setTimeout(() => {
            $('#pop-up-container', {
                addClass: 'hide',
                child: 0,
                removeClass: 'pop-up-anim'
            })

            clearTimeout(tout)
        }, 4500)
    }
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
function clickBtnControls(el) {
    listSongs.length ? btnActions(el.id)
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
    const animation = () => {
        $('#list-songs').scrollTop += direction === 'up' ? -3.6 : 3.6
        interval = requestAnimationFrame(animation)
    }
    interval = requestAnimationFrame(animation)
}

/**
 * Closes all the config modals
 */
function closeModals() {
    ipcRenderer.send('open-specific-key', 'Space')
    $('#main-parent-container', { rmAttr: 'style' })
    $('.parent-container-config', {
        addClass: 'hide',
        each(v) {
            $(v, {
                child: 0,
                removeClass: 'container-config-anim'
            })
        }
    })

    // Clear all the used variables for all the config modals
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
        $('.warning', { text: '' })
        isModalOpen = true
        ipcRenderer.send('close-specific-key', {
            keyName: 'Space',
            keepUnregistered: true
        })
    }
}

/** --------------------------------------- Events --------------------------------------- **/
// Takes us toward the song that is playing now
$('#song-title', {
    on: {
        click(el) {
            if (el.children[0].textContent.trim()) {
                clickedElement = $('#list-songs')
                positionElement = $(`#${$(el, { data: 'position' })}`)
                const element = clickedElement.scrollTop
                const distance = positionElement.offsetTop - Math.round($('#top-nav').offsetHeight) + 70
                clickedElement.scrollTop += element !== distance ? (distance - element) : -(distance - element)
            }
        }
    }
})

// Scrolling the list of songs like it was the scrollbar of the browser
$('.arrow-updown', {
    on: {
        mousedown(el) { scrollAnimation($(el, { data: 'direction' })) },
        mouseup(el) { cancelAnimationFrame(interval) }
    }
})

// Actions over the buttons play, next, prev and shuffle
$('.btn-controls', { on: { click: clickBtnControls } })

// Event to close all the config modals
$('.close', { on: { click: closeModals } })

/** --------------------------------------- Ipc Renderers --------------------------------------- **/
// Sends the values from the equalizer to the AudioContext [player/controls/index.js]
ipcRenderer.on('get-equalizer-filter', (e, a) =>
    player.getMediaControl(player.mediaControl()).setFilterVal(a)
)

// Plays or pause song [Space]
ipcRenderer.on('play-and-pause-song', () => {
    if (listSongs.length && $('#spinner', { has: 'hide' }))
        player.getMediaControl(player.mediaControl()).playSong()
})

// Next song [Ctrl + Right]
ipcRenderer.on('next-song', () => {
    if (listSongs.length && $('#spinner', { has: 'hide' }))
        player.getMediaControl(player.mediaControl()).nextSong()
})

// Prev song [Ctrl + Left]
ipcRenderer.on('prev-song', () => {
    if (listSongs.length && $('#spinner', { has: 'hide' }))
        player.getMediaControl(player.mediaControl()).prevSong()
})

// Shuffle [Ctrl + Down]
ipcRenderer.on('shuffle', () => {
    if ($('#spinner', { has: 'hide' }))
        player.getMediaControl(player.mediaControl()).setShuffle()
})

// ThumbarButtons [Windows]
ipcRenderer.on('thumbar-controls', (e, a) => btnActions(a))

// Displays the windows to add a musics folders [Ctrl + N]
ipcRenderer.on('menu-add-folder', () => {
    !menu.preferences.configurations.isResized() || isModalOpened(menu.folders.loadFolder)
})

// Displaya the album to be played [Ctrl + Shift + A]
ipcRenderer.on('menu-play-album', () => {
    !menu.preferences.configurations.isResized() || menu.folders.albumFolder.loadFullAlbum()
})

// Displays the equalizer [Ctrl + E]
ipcRenderer.on('menu-equalizer', () => {
    !menu.preferences.configurations.isResized() || isModalOpened(menu.equalizer.showEqualizer)
})

// Displays the configurations [Ctrl + O]
ipcRenderer.on('menu-configurations', () => {
    !menu.preferences.configurations.isResized() || isModalOpened(menu.preferences.configurations.showConfigurations)
})

// Displays info about Soube
ipcRenderer.on('menu-about', () => {
    !menu.preferences.configurations.isResized() || isModalOpened(menu.preferences.about)
})
