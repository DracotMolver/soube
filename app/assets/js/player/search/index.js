/**
 * @module player/search/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * It will search for the song we are searching for. It creates the buttons to play the song
 * and also the slider with its animation.
 */

/** -=================================== Modules ===================================- **/
// ---- Electron ----
const path = require('path')

// ---- Own ----
const { $ } = require(path.join(__dirname, '../../', 'dom'))

/* -=================================== Variables ===================================- */
let listOfSongs
let listOfSongsContent

window.onload = () => {
    listOfSongs = $('#list-songs', { child() { } })
}

/* -=================================== Functions ===================================- */
/**
 * Replace the &nbsp; values by whitespace
 * 
 * @param {string} value
 * @returns {string} - the new parsed string
 */
function nbspToSpace(value) {
    return value.replace(/&nbsp;/g, ' ')
}

/**
 * It will display a select option for title, album and artist
 * 
 * @param {string} value - The id of the HTMLElmento
 */
function scroll(value) {
    clickedElement = $('#list-songs')
    positionElement = $(`#${value}`)
    const element = clickedElement.scrollTop
    const distance = positionElement.offsetTop - Math.round($('#top-nav').offsetHeight) + 89
    clickedElement.scrollTop += element !== distance ? (distance - element) : -(distance - element)
}

function orderBy(by, el) {
    switch (by) {
        case 'title': sorted(el, 0); break
        case 'artist': sorted(el, 1); break
        case 'album': sorted(el, 2); break
    }
}

function sorted(el, pos) {
    let by = $(el, { data: 'by' })
    let _a = ''
    let _b = ''

    const list = listOfSongs.sort((a, b) =>
        (_a = nbspToSpace($(a, { child: pos, text: null }).toLowerCase()).normalize('NFC'),
        _b = nbspToSpace($(b, { child: pos, text: null }).toLowerCase()).normalize('NFC'),
        by === 'down' ? (_a < _b ? -1 : _a > _b) : (_a > _b ? -1 : _a < _b))
    )

    $(el, { data: { 'by': by === 'down' ? 'up' : 'down' } })
    $('#list-songs', { empty() { }, append: list })
}

/**
 * @param {string} by - title, album or artist
 * @param {object} player - The instance of the music player
 * @param {HTMLElement} el - The select field
 */
function filterBy(by, player, el) {
    switch (by) {
        case 'title':
            if (el.value !== 'all') {
                scroll(el.value)
                player.getMediaControl('player').playSongAtPosition(el.value)
            }
            break
        case 'artist': if (el.value !== 'all') scroll(el.value); break
        case 'album': if (el.value !== 'all') scroll(el.value); break
    }

    el.selectedIndex = 0
}

module.exports = {
    filterBy,
    orderBy
}