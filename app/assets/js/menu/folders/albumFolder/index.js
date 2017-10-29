/**
 * @module albumFolder/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * This module get the metadata from a single folder (thinking as an album)
 * Stops the player and creates a new view for playing the songs from the folder
 */

 /* -=================================== Modules ===================================- */
// ---- Electron ----
const dialog = require('electron').remote.dialog

// ---- Node ----
const path = require('path')

// ---- Own ----
const songFolder = require(path.join(__dirname, '../', 'songFolder'))
const {
    configFile,
    langFile,
    listSongs
} = require(path.join(__dirname, '../../../', 'config')).init()
let player = require(path.join(__dirname, '../../../', 'player'))
const { $ } = require(path.join(__dirname, '../../../', 'dom'))

/* -=================================== Variables ===================================- */
const lang = langFile[configFile.lang]

/* -=================================== Functions ===================================- */
/**
 * Displays a modal dialog to get the path from where to read the song files
 */
function loadFullAlbum() {
    dialog.showOpenDialog({
        title: 'Open an album',
        properties: ['openDirectory']
    }, parentFolder => {
        parentFolder && getSongs(parentFolder[0]);
    })
}

/**
 * Extract all the metadata from the song files
 * 
 * @param {string} parentFolder - The path of the parent folder
 */
function getSongs(parentFolder) {
    songFolder.addSongFolder(parentFolder, () =>
        $($('.parent-container-config')[0], {
            removeClass: 'hide',
            child: 0,
            addClass: 'container-config-anim'
        })
        , (i, maxLength) => { // Iterator function
            $('#album-to-play', {
                child: 1,
                text:
                `<div id="album-loading">${lang.config.loadingAlbumFolder}${Math.floor((i * 100) / maxLength)}%</div>`
            })

            i === maxLength - 1 && createView(parentFolder, songFolder.setAlphabeticOrder());
        }, true)
}

/**
 * Will stop the player and it will creates a new "view" only for an album.
 * The loaded songs are naver saved.
 *
 * @param {string} folder - the name of the parent folder. Not the whole path.
 * @param {array} songs - An array of objects containing all the needed metadata.
 */
function createView(folder, songs) {
    player.getMediaControl(player.mediaControl()).stopSong()
    player.setUsingMediaControl('album')
    player.getMediaControl(player.mediaControl()).setSongs(songs)
    player.getMediaControl(player.mediaControl()).reset()
    player.createAlbumView(player, folder, songs)
}

/**
 * Stop the played song and destroy the "album view",
 * allowing to use the music player
 */
function closeAlbum() {
    player.getMediaControl(player.mediaControl()).stopSong()
    player.setUsingMediaControl('player')
    player.getMediaControl(player.mediaControl()).setSongs(listSongs)
    player.getMediaControl(player.mediaControl()).reset()
}

module.exports = Object.freeze({
    loadFullAlbum,
    closeAlbum
})
