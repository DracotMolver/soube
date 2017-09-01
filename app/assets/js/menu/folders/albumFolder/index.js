/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
// ---- Electron ----
const dialog = require('electron').remote.dialog

// ---- Node ----
const path = require('path')

// ---- Own ----
const songFolder = require(path.join(__dirname, '../', 'songFolder'))
const {
  configFile,
    langFile
} = require(path.join(__dirname, '../../../', 'config')).init()
let player = require(path.join(__dirname, '../../../', 'player'))
const $ = require(path.join(__dirname, '../../../', 'dom'))

/* --------------------------------- Variables --------------------------------- */
const lang = langFile[configFile.lang]

/* --------------------------------- Functions --------------------------------- */
function loadFullAlbum() {
    dialog.showOpenDialog({
        title: 'Open an album',
        properties: ['openDirectory']
    }, function (parentFolder) {
        console.log(parentFolder)
        if (parentFolder !== undefined)
            getSongs(parentFolder[0])
    })
}

function getSongs(parentFolder) {
    songFolder.addSongFolder(parentFolder, function () {
        $($('.parent-container-config').get(0))
            .removeClass('hide')
            .child(0)
            .addClass('container-config-anim')
    }, function (i, maxLength) { // Iterator function
        $('#album-to-play').child(1).text(
            `<div id="album-loading">${lang.config.loadingAlbumFolder}${Math.floor((i * 100) / maxLength)}%</div>`
        )

        if (i === maxLength)
            createView(parentFolder, songFolder.setAlphabeticOrder())
    }, true)
}

function createView(folder, songs) {
    player.getMediaControl(player.mediaControl()).stopSong()
    player.setUsingMediaControl('album')
    player.getMediaControl(player.mediaControl()).setSongs(songs)
    player.createAlbumView(player, folder, songs)
}

function closeAlbum() {
    player.getMediaControl(player.mediaControl()).stopSong()
    player.setUsingMediaControl('player')
}

module.exports = Object.freeze({
    loadFullAlbum,
    closeAlbum
})
