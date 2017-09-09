/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
// ---- nodejs ----
const exec = require('child_process').exec
const path = require('path')
const url = require('url')
const fs = require('fs')

// ---- electron ----
const ipcRenderer = require('electron').ipcRenderer

// ---- other ----
const audioMetaData = require('audio-metadata')

// ---- own ----
const {
    configFile,
    listSongs,
    langFile,
    editFile
} = require(path.join(__dirname, '../../../', 'config')).init()
const $ = require(path.join(__dirname, '../../../', 'dom'))

const worker = new Worker(path.join(__dirname, 'workerPaths.js'))
const workerDB = new Worker(path.join(__dirname, 'workerDB.js'))

/* --------------------------------- Variables --------------------------------- */
// ---- normals ----
let lang = langFile[configFile.lang]
let songs = []
let files = []
let count = 0
let metadata
let iter

/* --------------------------------- Functions --------------------------------- */
// Will get all this songs files.
// It will compare if there's more or few songs
function addSongFolder(folder, fnStart, fnIter, newInstance = false) {
    // Get the object from listsong.json - only if was already created it
    songs = $('@objSize')(listSongs) && newInstance ? [] : ($('@objSize')(listSongs) ? listSongs : [])
    const readAllFiles = function (readFiles) {
        if (readFiles.length) { // Add songs
            files = readFiles.map(function (f) {
                return path.normalize(f)
            })
            fnStart()
            iter = fnIter
            extractMetadata()
        }
    }

    readParentFolder(folder, readAllFiles)
}

function removeSongFolder(folder) {
    // Get the object from listsong.json - only if was already created it
    const readAllFiles = function (readFiles) {
        songs = []
        listSongs.forEach(function (f, i, a) {
            readFiles.indexOf(f.filename) !== -1 ? delete a[i] : songs.push(f)
        })

        editFile('listSong', setAlphabeticOrder())
    }

    readParentFolder(folder, readAllFiles)
}

function checkSongFolder(folder, fnStart, fnIter) {
    let totalFiles = []
    let newFiles = []
    let fileNames = listSongs.map(function (f) { return f.filename })
    let index = 0

    const readAllFiles = function (readFiles) {
        totalFiles = totalFiles.concat(readFiles)
        if (++index === folder.length) {
            if ($('@objSize')(listSongs) < totalFiles.length) { // Append new songs
                totalFiles.forEach(function (f) {
                    if (fileNames.indexOf(f) === -1) newFiles.push(f)
                })
                songs = listSongs
                files = newFiles.map(function (f) {
                    return path.normalize(f)
                })

                fnStart()
                iter = fnIter
                extractMetadata()
            } else if ($('@objSize')(listSongs) > totalFiles.length){
                songs = []
                listSongs.forEach(function (f, i, a) {
                    totalFiles.indexOf(f.filename) === -1 ? delete a[i] : songs.push(f)
                })

                editFile('listSong', setAlphabeticOrder())
            }
        }
    }

    folder.forEach(function (f) { readParentFolder(f, readAllFiles) })
}

// Will get all the needed metadata from a song file
function extractMetadata() {
    xhtr = new XMLHttpRequest()
    xhtr.open('GET', url.format({
        pathname: files[count],
        protocol: 'file:'
    }), true)
    xhtr.responseType = 'arraybuffer'
    xhtr.onload = function () {
        metadata = /\.(mp3|wav)$/ig.test(files[count])
            ? audioMetaData.id3v1(xhtr.response)
            : audioMetaData.ogg(xhtr.response)

        if (metadata === null) metadata = audioMetaData.id3v2(xhtr.response)

        songs.push({
            artist: spaceToNbsp(metadata.artist !== undefined ? metadata.artist.trim() : lang.artist),
            album: spaceToNbsp(metadata.album !== undefined ? metadata.album.trim() : lang.album),
            title: spaceToNbsp(metadata.title !== undefined ? metadata.title.trim() : lang.title),
            filename: files[count]
        })

        if (count === files.length - 1) {
            workerDB.postMessage({
                state: 'done'
            })
            iter(count, files.length)
        } else {
            workerDB.postMessage({
                state: 'open'
            })
            iter(count, files.length)
        }
    }
    xhtr.send(null)

    workerDB.onmessage = function (e) {
        if (e.data.state === 'next') {
            ++count
            extractMetadata()
        } else if (e.data.state === 'close') {
            return true
        }
    }
}

function readParentFolder(folder, fn) {
    // command line [Linux | Mac]
    if (process.platform === 'darwin' || process.platform === 'linux') {
        const command = `find ${path.normalize(folder.replace(/\b\s{1}/g, '\\ '))} -type f | grep -E \"\.(mp3|wav|ogg)$\"`
        exec(command, function (error, stdout, stderr) {
            if (error) {
                ipcRenderer.send('display-msg', {
                    type: 'info',
                    message: lang.alerts.error_003,
                    detail: stderr,
                    buttons: ['Ok']
                })

                return
            }

            fn(stdout.trim().split('\n'))
        })
    } else if (process.platform === 'win32') {
        // // Only for windows
        worker.postMessage({ 'folder': folder })
        worker.onmessage = function (e) {
            fn(e.data.files.split('|'))
        }
    }
}

function spaceToNbsp(str) {
    return str.trim().replace(/\s/g, '&nbsp;').replace('ÿþ', '')
}

function setAlphabeticOrder() {
    return songs.sort(function (a, b) {
        return a.artist.toLowerCase().normalize('NFC') < b.artist.toLowerCase().normalize('NFC') ? -1
            : a.artist.toLowerCase().normalize('NFC') > b.artist.toLowerCase().normalize('NFC')
    }).map(function (v, i) {
        return v.position = i, v
    })
}

module.exports = Object.freeze({
    removeSongFolder,
    checkSongFolder,
    addSongFolder,
    setAlphabeticOrder
})
