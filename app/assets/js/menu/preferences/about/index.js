/**
 * @module about/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * This is a simple module to display some information related to the music player
 */
/** -=================================== Modules ===================================- **/
// ---- Node ----
const path = require('path')

// ---- Electron ----
const shell = require('electron').shell

// ---- Own ----
const {
    configFile,
    langFile
} = require(path.join(__dirname, '../../../', 'config')).init()
const { $ } = require(path.join(__dirname, '../../../', 'dom'))

/* -=================================== Variables ===================================- */
let lang = langFile[configFile.lang]

/** -=================================== Functions ===================================- **/
module.exports = function showAbout() {
    'use strict'

    $('#main-parent-container', { css: '-webkit-filter:blur(1px)' })
    $('#_about', { text: lang.aboutContent })

    $(':a', {
        on: {
            click(el, e) {
                e.preventDefault()
                shell.openExternal(el.href)
            }
        }
    })

    $($('.parent-container-config')[4], {
        removeClass: 'hide',
        child: 0,
        addClass: 'container-config-anim'
    })
}
