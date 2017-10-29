/**
 * @module songFolder/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * This is the main module to extract all the song files loaded in the music player
 */

/* -=================================== Modules ===================================- */
// ---- nodejs ----
const exec = require('child_process').exec
const path = require('path')
const util = require('util')

// ---- electron ----
const ipcRenderer = require('electron').ipcRenderer

// ---- other ----
const mm = require('music-metadata');

// ---- own ----
const {
    configFile,
    listSongs,
    langFile,
    editFile
} = require(path.join(__dirname, '../../../', 'config')).init()
const { $ } = require(path.join(__dirname, '../../../', 'dom'))
const worker = new Worker(path.join(__dirname, 'workerPaths.js'))
const workerDB = new Worker(path.join(__dirname, 'workerDB.js'))

/* -=================================== Variables ===================================- */
let lang = langFile[configFile.lang]
let songs = []
let files = []
let count = 0
let artist = ''
let title = ''
let album = ''
let keys = {}
let iter

/* -=================================== Functions ===================================- */
/**
 * It will read all the folder from a root folder.
 * 
 * @param {string} folder - Root folder or parent folder
 * @param {function} fnStart - A callback function when start extracting the metadata
 * @param {function} fnIter - A loop callback called for every song file
 * @param {boolean} [newInstance=false] - If true, it will extract metadata by without saving the data
 */
function addSongFolder(folder, fnStart, fnIter, newInstance = false) {
    // Get the object from listsong.json - only if was already created it
    songs = $('@objSize')(listSongs) && newInstance ? [] : ($('@objSize')(listSongs) ? listSongs : [])
    const readAllFiles = readFiles => {
        if (readFiles.length) { // Add songs
            files = readFiles.map(f => path.normalize(f))
            fnStart()
            iter = fnIter
            extractMetadata()
        }
    }
    readParentFolder(folder, readAllFiles)
}

/**
 * Remove any added folder
 * 
 * @param {string} folder - The path of the parent folder to remove
 */
function removeSongFolder(folder) {
    const readAllFiles = readFiles => {
        songs = listSongs.filter(f => readFiles.indexOf(f.filename) === -1)
        editFile('listSong', songs.length ? setAlphabeticOrder() : {})
    }
    readParentFolder(folder, readAllFiles)
}

/**
 * It will compare if there was deleted or added any new song file.
 * If a song was added, it will extract its metadata. By the other hand
 * it will be remove the metadata from the music player
 * 
 * @param {any} folder - The root folder or parent folder
 * @param {any} fnStart - A callback to execute when beggining checking
 * @param {any} fnIter - A loop callback when any song file was added or delted
 */
function checkSongFolder(folder, fnStart, fnIter) {
    let totalFiles = []
    let newFiles = []
    let fileNames = listSongs.map(f => f.filename)
    let index = 0

    function readAllFiles(readFiles) {
        totalFiles = totalFiles.concat(readFiles)
        if (++index === folder.length) {
            if ($('@objSize')(listSongs) < totalFiles.length) { // Append new songs
                totalFiles.forEach(f => {
                    fileNames.includes(f) || newFiles.push(f);
                })
                songs = listSongs
                files = newFiles.map(f => path.normalize(f))

                fnStart()
                iter = fnIter
                extractMetadata()
            } else if ($('@objSize')(listSongs) > totalFiles.length) { // Delete a song
                songs = []
                listSongs.forEach((f, i, a) => !totalFiles.includes(f.filename) ? delete a[i] : songs.push(f))

                editFile('listSong', setAlphabeticOrder())
            }
        }
    }

    folder.forEach(f => readParentFolder(f, readAllFiles))
}

/**
 * It will extract all the needed metadata
 */
function extractMetadata() {
    mm.parseFile(files[count], { native: true })
        .then(metadata => {
            keys = Object.keys(metadata.native)

            artist = 'artist' in metadata.common
                ? metadata.common.artist
                : (keys.includes('ID3v1.1')
                    ? (metadata.native['ID3v1.1'][1].id === 'artist'
                        ? metadata.native['ID3v1.1'][1].value
                        : lang.artist)
                    : lang.artist)

            album = 'album' in metadata.common
                ? metadata.common.album
                : (album = keys.includes('ID3v1.1')
                    ? (metadata.native['ID3v1.1'][2].id === 'album'
                        ? metadata.native['ID3v1.1'][2].value
                        : lang.album)
                    : lang.album)

            title = 'title' in metadata.common
                ? metadata.common.title
                : (title = keys.includes('ID3v1.1')
                    ? (metadata.native['ID3v1.1'][0].id === 'title'
                        ? metadata.native['ID3v1.1'][0].value
                        : lang.title)
                    : lang.title)

            songs.push({
                'artist': spaceToNbsp(artist),
                'album': spaceToNbsp(album),
                'title': spaceToNbsp(title),
                'filename': files[count]
            })

            if (count === files.length - 1) {
                workerDB.postMessage({ state: 'done' })
                iter(count, files.length)
                songs = files = []
                count = 0
            } else {
                workerDB.postMessage({ state: 'open' })
                iter(count, files.length)
            }
        })
        .catch(function (err) {
            console.error(err.message);
        });

    // Using workers is a cool way to avoid stackoverflow
    workerDB.onmessage = e => {
        if (e.data.state === 'next') {
            ++count
            extractMetadata()
        }
    }
}

/**
 * Will read all the folders [1...N] from the parent folder.
 * For Linux and Mac, It makes use of command lines
 *
 * Due the window limitation reading from console, I did this function to
 * read all the folders
 * 
 * @param {string} folder - Root or parent folder
 * @param {function} fn - A callback function to pass all the path folders
 */
function readParentFolder(folder, fn) {
    // command line [Linux | Mac]
    if (process.platform === 'darwin' || process.platform === 'linux') {
        const command = `find ${path.normalize(folder.replace(/\b\s{1}/g, '\\ '))} -type f | grep -E \"\.(mp3|wav|ogg)$\"`
        exec(command, (error, stdout, stderr) => {
            error && ipcRenderer.send('display-msg', {
                type: 'info',
                message: lang.alerts.error_003,
                detail: stderr,
                buttons: ['Ok']
            });

            fn(stdout.trim().split('\n'))
        })
    } else if (process.platform === 'win32') {
        // Only for windows
        worker.postMessage({ 'folder': folder })
        worker.onmessage = e => fn(e.data.files.split('|'))
    }
}

/**
 * Parse an string, replacing the whitespaces by &nbsp;
 * @param {any} str - The string to Parase
 * @returns {string} - The new string
 */
function spaceToNbsp(str) {
    return str.trim().replace(/\s/g, '&nbsp;').replace('ÿþ', '')
}

/**
 * Sort all the extracted song files based on the song title
 * @returns {array} - A new array holding the sorted songs
 */
function setAlphabeticOrder() {
    let a_artist = ''
    let b_artist = ''

    return songs.sort((a, b) =>
        (a_artist = a.artist.toLowerCase().normalize('NFC'),
            b_artist = b.artist.toLowerCase().normalize('NFC'),
            a_artist < b_artist ? -1 : a_artist > b_artist)
    ).map((v, i) => (v.position = i, v))
}

module.exports = Object.freeze({
    removeSongFolder,
    checkSongFolder,
    addSongFolder,
    setAlphabeticOrder
})
