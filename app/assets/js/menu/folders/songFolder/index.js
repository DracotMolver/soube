/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
// ---- nodejs ----
const exec = require('child_process').exec
const path = require('path')
const fs = require('fs')

// ---- electron ----
const ipcRenderer = require('electron').ipcRenderer

// ---- other ----
const musicmetadata = require('musicmetadata')

// ---- own ----
const {
  configFile,
  listSongs,
  langFile,
  editFile
} = require(path.join(__dirname, '../../../', 'config')).init()
const worker = new Worker(path.join(__dirname, 'workerPaths.js'))

/* --------------------------------- Variables --------------------------------- */
// ---- normals ----
let lang = langFile[configFile.lang]
let songs = []
let files = []

/* --------------------------------- Functions --------------------------------- */
// Will get all this songs files.
// It will compare if there's more or few songs
function addSongFolder(folder, fnStart, fnIter, newInstance = false) {
  // Get the object from listsong.json - only if was already created it
  songs = Object.keys(listSongs).length && newInstance ? [] : listSongs
  const readAllFiles = function (readFiles) {
    if (readFiles.length) { // Add songs
      files = readFiles.map(function (f) {
        return path.normalize(f)
      })

      fnStart()
      extractMetadata(fnIter)
    }
  }

  readParentFolder(folder, readAllFiles)
}

// Will get all the needed metadata from a song file
function extractMetadata(fnIter) {
  let count = 0
  files.forEach(function (f) {
    musicmetadata(fs.createReadStream(f), function (error, data) {
      count++
      // In case of empty data, it will save data using what is inside the lang.json file
      songs.push(
        {
          artist: spaceToNbsp(data.artist.length ? data.artist[0].trim() : lang.artist),
          album: spaceToNbsp(data.album !== '' ? data.album.trim() : lang.album),
          title: spaceToNbsp(data.title !== '' ? data.title.trim() : lang.title),
          filename: f
        }
      )
      fnIter(count, files.length)
    })
  })
}

function updateSongList() {
  editFile('listSong', getAllSongs())
}

function removeSongFolder(folder) {
  // Get the object from listsong.json - only if was already created it
  const readAllFiles = function (readFiles) {
    songs = []
    listSongs.forEach(function (f, i, a) {
      readFiles.indexOf(f.filename) !== -1 ? delete a[i] : songs.push(f)
    })

    updateSongList()
  }

  readParentFolder(folder, readAllFiles)
}

function readParentFolder(folder, fn) {
  // command line [Linux | Mac]
  if (process.platform === 'darwin' || process.platform === 'linux') {
    const command = `find ${path.normalize(folder.replace(/\b\s{1}/g, '\\ '))} -type f | grep -E \"\.(mp3|wmv|wav|ogg)$\"`
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
  return str.trim().replace(/\s/g, '&nbsp;')
}

function getAllSongs() {
  return songs.sort(function (a, b) {
    return a.artist.toLowerCase().normalize('NFC') < b.artist.toLowerCase().normalize('NFC') ? -1
      : a.artist.toLowerCase().normalize('NFC') > b.artist.toLowerCase().normalize('NFC')
  }).map(function (v, i) {
    return v.position = i, v
  })
}

module.exports = Object.freeze({
  removeSongFolder,
  updateSongList,
  addSongFolder,
  getAllSongs
})
