/**
 * @author Diego Alberto Molina Vera.
 * @copyright 2016 - 2017
 */
/** --------------------------------------- // --------------------------------------- **/
// Basically this will load the neede modules to display the songs
// and play them.
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
    setUsingMediaControl: function (media) {
        usingMediaControl = media
    },
    mediaControl: usingMediaControl,
    getMediaControl: function (media) {
        return mediaControl[media]
    },
    createAlbumView,
    createView,
    search
})
