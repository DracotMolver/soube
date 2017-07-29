/**
 * @module assets/player/index.js
 * @author Diego Alberto Molina Vera.
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * Basically, this will load all the needed modules to make the music player works.
 * Modules:
 * - Controls - All the events over the play, next, prev, shuffle, time lapse, time progress, etc.
 * - Search - Search the songs we are searching for
 * - Createview - Creates and renders the HTML for the list of sons as it or for the album view.
 */
/** --------------------------------------- Modules --------------------------------------- **/
const {
    createAlbumView,
    createView,
} = require('./createView')
const controls = require('./controls')
const search = require('./search')

/** --------------------------------------- Variables --------------------------------------- **/
let usingMediaControl = 'player'

let mediaControl = {
    player: new controls('player'),
    album: new controls('album')
}

module.exports = Object.freeze({
    /**
     * @param {string} media - Indicates which option we are gonna use,
     *                         the music player as such or to play just an album. values:[player|album]
     */
    setUsingMediaControl: function (media) {
        usingMediaControl = media
    },
    /**
     * @return {string} - Returns [player|album]
     */
    mediaControl: function () {
        return usingMediaControl
    },
    /**
     * return the instance of the player as a list player or an album player
     * @param {string} media - The actual media player: value[mediaControl]
     * @return {object} - Return the instance of the player
     */
    getMediaControl: function (media) {
        return mediaControl[media]
    },
    createAlbumView,
    createView,
    search
})
