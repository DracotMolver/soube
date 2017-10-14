/**
 * @module configurations/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 */

/** -=================================== Modules ===================================- **/
// ---- Electron ----
const electron = require('electron')
const ipcRenderer = electron.ipcRenderer

// ---- Node ----
const path = require('path')

// ---- Own ----
const {
    coloursFile,
    configFile,
    langFile,
    editFile
} = require(path.join(__dirname, '../../../', 'config')).init()
const { $, create } = require(path.join(__dirname, '../../../', 'dom'))

/* ===================================- Variables ===================================- */
let lang = langFile[configFile.lang]
let option = null
let resized = false

/** ===================================- Functions ===================================- **/
'use strict'
/**
 * Display all the options
 * - Theme colours
 * - Idiom
 * - Screen size
 * 
 * @param {HTMLElement} el - The selected option element
 */
function displayOption(el) {
    $('#theme-colours', { addClass: 'hide' })

    $('#idiom', { addClass: 'hide' })
    $('#screen-size', { addClass: 'hide' })

    switch (el.value) {
        case '1': showColoursTheme(); break
        case '2': showLanguage(); break
        case '3': $('#screen-size', { removeClass: 'hide' }); break
    }
}

/**
 * Change the size of the screen
 * 
 * @param {HTMLElement} el
 */
function enableScreenSize(el) {
    // enable the screen sizer
    $('#on-top', el.checked ? { removeClass: 'hide' } : { addClass: 'hide' })
    $('#sizer-container', el.checked ? { removeClass: 'hide' } : { addClass: 'hide' })
}

/**
 * Display the option to make an small music player
 * 
 * @param {HTMlElement} el
 */
function resizeScreen(el) {
    $('#sizer-container', {
        child: 0,
        attr: {
            src: path.join(__dirname, '../../../../', 'img', (resized = !resized) ? 'sizer02.svg' : 'sizer.svg')
        }
    })

    ipcRenderer.send('change-screen-size', {
        screenResize: resized,
        area: electron.screen.getPrimaryDisplay().workArea
    });
}

/**
 * Have the option to keep the music player always on top
 * 
 * @param {HTMLElement} el
 */
function alwaysOnTop(el) {
    ipcRenderer.send('set-on-top', el.checked)
}

/**
 * Change the idiom of the app
 */
function showLanguage() {
    $('#idiom', { removeClass: 'hide' })
    let i = ''
    switch (configFile.lang) {
        case 'es': i = 'Español<div class="checked-colour"></div>'; break
        case 'us': i = 'English<div class="checked-colour"></div>'; break
        case 'de': i = 'Deutsch<div class="checked-colour"></div>'; break
    }

    $(`#${configFile.lang}`, {
        text: i,
        css: 'background:#fcfcfc'
    })
}

/**
 * Set the selected idiom
 * 
 * @param {HTMLElement} el
 */
function choosenIdiom(el) {
    configFile.lang = el.id
    editFile('config', configFile)

    let i = ''
    switch (configFile.lang) {
        case 'es': i = 'Español'; break
        case 'us': i = 'English'; break
        case 'de': i = 'Deutsch'; break
    }

    $(`#${configFile.lang}`, {
        text: i,
        rmAttr: 'style'
    })

    $(`#${el.id}`, {
        text: `${i}<div class="checked-colour"></div>`,
        css: 'background:#fcfcfc'
    })

    setTimeout(() => ipcRenderer.send('restart-app'), 460)
}

/**
 * Change the colour of the app
 */
function showColoursTheme() {
    $('#theme-colours', { removeClass: 'hide' })
    $(`#${configFile.theme}`, { text: '<div class="checked-colour"></div>' })
}

/**
 * Save the choosen colour
 *
 * @param {HTMLELement} el
 */
function choosenColor(el) {
    $(`#${configFile.theme}`, { empty() { } })
    configFile.theme = el.id
    editFile('config', configFile)
    editFile(path.join(__dirname, '../../../../', 'css', 'color.css'), coloursFile[el.id], true)
    $(`#${el.id}`, { text: '<div class="checked-colour"></div>' })
}

/**
 * Show the whole config panel and makes all the needed items
 */
function showConfigurations() {
    $('#main-parent-container', { css: '-webkit-filter:blur(1px)' })
    $('#_configurations', { text: lang.config.configurations })

    let f = document.createDocumentFragment()
    lang.config.configurationsOpt.forEach((o, i) =>
        f.appendChild(create('option', {
            val: i,
            text: o
        }))
    )

    $('#config-options', {
        empty() { },
        append: f
    })

    // Colours options
    const coloursNames = Object.keys(coloursFile);
    $('.colour-name', {
        each(v, i) {
            $(v, { text: coloursNames[i] })
        }
    })

    $($('.parent-container-config')[3], {
        removeClass: 'hide',
        child: 0,
        addClass: 'container-config-anim'
    })
}

/** -=================================== Events ===================================- **/
// Screen size
$('#enable-screen-size', { on: { change: enableScreenSize } })

// Screen always on top
$('#always-on-top', { on: { change: alwaysOnTop } })

// idiom
$('.idiom-item', { on: { click: choosenIdiom } })

// Clorous
$('.colour', { on: { click: choosenColor } })

// Display all the options
$('#config-options', { on: { click: displayOption } })

// Action on the image to resize the screen
$('#sizer-container', {
    child: 0,
    on: { click: resizeScreen }
})

module.exports = Object.freeze({
    showConfigurations,
    close() {
        $('#theme-colours', { addClass: 'hide' })
        $('#idiom', { addClass: 'hide' })
        $('#screen-size', { addClass: 'hide' })
        option = null
    },
    isResized() { return resized }
})
