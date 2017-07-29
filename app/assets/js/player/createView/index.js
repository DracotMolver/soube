/**
 * @module assets/player/createView/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * It will create the HTML and render it. The HTML by default is the music player and the view
 * is displays as a list view. Also, it creates the album view.
 *
 * The list view is to play all the songs avialable from the folder we've loaded.
 * The album view is to play only the songs from the album (one) we've loaded.
 * The album view is not going to live for ever, by the other hand the list view is by default.
 * So it's always created and rendered
 */
/** --------------------------------------- Modules --------------------------------------- **/
// ---- Electron ----
const path = require('path')

// ---- Own ----
const listSongs = require(path.join(__dirname, '../../', 'config')).init().listSongs
const $ = require(path.join(__dirname, '../../', 'dom'))

/** --------------------------------------- Functions --------------------------------------- **/
/**
 * 
 * @param {object} _t - The object where the event has been triggerd
 * @param {any} player - The instance of the player
 */
function playSong(_t, player) {
    // It's needed to be passed the player instance because we need to know
    // if the song is gonna be played from the list of song or from the album view
    player.getMediaControl(player.mediaControl()).playSongAtPosition($(_t).data('position'))
}

/**
 * It turns &nbps to whitespace
 * @param {string} value - Any string to be cleaned
 * @return {string} A new string with whitespace instead &nbps 
 */
function nbspToSpace(value) {
    return value.replace(/&nbsp;/g, ' ')
}

/**
 * It will create and render the list of songs as a list view
 * @param {object} player - The instance of the player
 */
function createView(player) {
    const f = document.createDocumentFragment()

    // Building the basic structure of elements.
    // The parent element must be created, because we will attach a function to it.
    // The rest of the elements, the childNodes, are not need to create them.
    // They can be just html text.
    let parent = $(document.createElement('div')).addClass('list-song-container grid-100 grid-parent').get()

    listSongs.forEach(function (v, i) {
        f.appendChild(
            $(parent.cloneNode(true))
                .attr({
                    id: i,
                    title: `${nbspToSpace(v.title)} by ${nbspToSpace(v.artist)} from ${nbspToSpace(v.album)}`
                })
                .text(`
                    <div class="grid-33 mobile-grid-33 song-info">${v.title}</div>
                    <div class="grid-33 mobile-grid-33 song-info"><span class="miscelaneo">by</span>${v.artist}</div>
                    <div class="grid-33 mobile-grid-33 song-info"><span class="miscelaneo">from</span>${v.album}</div>
                `)
                .data({
                    position: i,
                    artist: v.artist,
                    title: v.title,
                    album: v.album,
                    url: v.filename
                })
                .on({
                    click: function () {
                        playSong(this, player)
                    }
                }).get())
    })

    $('#list-songs').append(f)
}

/**
 * It will create and render the list of songs from an album, redering
 * as an album view
 * @param {object} player - Instance of the player
 * @param {string} folder - Path from where the album is loaded.
 *                          This is to get the name of the album
 * @param {array} listSongs - List of songs from the album.
 */
function createAlbumView(player, folder, listSongs) {
    let div = $(document.createElement('div')).addClass('grid-100').get()
    const fragment = document.createDocumentFragment()

    // Name of the band or artist
    fragment.appendChild(
        $(div.cloneNode(true))
            .attr({ id: 'album-title-artist' })
            .text(listSongs[0].artist).get())

    // Name of the album
    fragment.appendChild(
        $(div.cloneNode(true))
            .attr({ id: 'album-title-album' })
            .text(path.basename(folder)).get())

    // List of songs
    listSongs.forEach(function (s, i) {
        fragment.appendChild(
            $(div.cloneNode(false))
                .addClass('album-title-song')
                .attr({ 'id': `al-${i}` })
                .data({
                    position: i,
                    artist: s.artist,
                    title: s.title,
                    album: s.album,
                    url: s.filename
                })
                .on({
                    click: function () {
                        playSong(this, player)
                    }
                }).text(s.title).get())
    })

    $('#album-to-play').empty().append(fragment)
}

module.exports = Object.freeze({
    createAlbumView,
    createView
})
