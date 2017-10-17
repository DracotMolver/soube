/**
 * @module about/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * It will load all the songs, add new ones and delete them.
 */

/** -=================================== Modules ===================================- **/
// ---- Electron ----
const remote = require('electron').remote

// ---- Node ----
const path = require('path')

// ----Own ---
const albumFolder = require('./albumFolder')
const songFolder = require('./songFolder')
const {
    configFile,
    langFile,
    editFile
} = require(path.join(__dirname, '../../', 'config')).init()
const { $, create } = require(path.join(__dirname, '../../', 'dom'))

/** -=================================== Variables ===================================- **/
let lang = langFile[configFile.lang]
let folderToRemove = ''
let isLoadingSongs = false
let itemToRemove
let li = document.createElement('li')

/** -=================================== Functions ===================================- **/
function removeItem(el) {
    $('#remove-songs', { removeClass: 'hide' })
    $('.warning', { text: `${lang.config.removingSongFolder} ${(folderToRemove = el.textContent)}` })
}

// Get the path song
function saveSongList(parentFolder = '') {
    $('#add-songs', { attr: { disabled: true } })
    isLoadingSongs = true
    configFile.musicFolder.push(parentFolder)
    editFile('config', configFile)

    $('#path-list-container', {
        append: create('li', {
            text: parentFolder,
            on: { click: removeItem }
        })
    })

    // Show a loading
    // Read the content of the parent folder
    songFolder.addSongFolder(parentFolder, () => $('#add-songs', { text: lang.config.loadingSongFolder }),
        (i, maxLength) => { // Iterator function
            $('#add-songs', {
                text: `${lang.config.loadingSongFolder}${Math.floor((i * 100) / maxLength)}%`
            })
            $('#song-progress', { css: `width:${(i * 100) / maxLength}%` })

            if (i === maxLength - 1)
                editFile('listSong', songFolder.setAlphabeticOrder())
        })
}

function loadFolder() {
    $('#main-parent-container', { css: '-webkit-filter:blur(1px)' })
    $('#_addsongfolder', { text: lang.config.addSongFolder })
    $('#path-list-container', { empty() { } })


    configFile.musicFolder.forEach(v =>
        $('#path-list-container', {
            append: create('li', {
                text: v,
                on: { click: removeItem }
            })
        })
    )

    $('#add-songs', { text: lang.config.addSongBtn })
    $('#remove-songs', { text: lang.config.removeSongBtn })

    // Execute the animation at the end of the code
    $($('.parent-container-config')[1], {
        removeClass: 'hide',
        child: 0,
        addClass: 'container-config-anim'
    })
}

/* --------------------------------- Events --------------------------------- */
$('#remove-songs', {
    on: {
        click(el) {
            configFile.musicFolder = configFile.musicFolder.filter(v => folderToRemove !== v)
            editFile('config', configFile)

            el.remove()
            songFolder.removeSongFolder(folderToRemove)

            $('#remove-songs', { addClass: 'hide' })
        }
    }
})

$('#add-songs', {
    on: {
        click(el) {
            isLoadingSongs ||
                // Action to add the songs
                remote.dialog.showOpenDialog({
                    title: 'Add music folder',
                    properties: ['openDirectory']
                }, parentFolder => {
                    // console.log(url.parse(parentFolder[0], true), parentFolder[0]);
                    if (parentFolder) saveSongList(parentFolder[0])
                })
        }
    }
})

module.exports = Object.freeze({
    albumFolder,
    loadFolder,
    checkListOfSongs() {
        songFolder.checkSongFolder(configFile.musicFolder, () => {
            $('#pop-up-container', {
                removeClass: 'hide',
                child: 0,
                addClass: 'pop-up-anim'
            })
            $('#pop-up', { text: langFile[configFile.lang].alerts.checkListOfSongs })
        }, (i, maxLength) => {
            if (i === maxLength) {
                const timeOut = setTimeout(() => {
                    editFile('listSong', songFolder.setAlphabeticOrder())
                    $('#pop-up', { empty() { } })
                    $('#pop-up-container', {
                        addClass: 'hide',
                        child: 0,
                        removeClass: 'pop-up-anim'
                    })
                    clearTimeout(timeOut)
                }, 4600);
            }
        })
    },
    close() {
        folderToRemove = ''
        isLoadingSongs = false
        itemToRemove = null
    }
})
