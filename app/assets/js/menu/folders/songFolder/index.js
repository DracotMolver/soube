/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
//---- nodejs ----
const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs');

//---- electron ----
const ipcRenderer = require('electron').ipcRenderer;

//---- other ----
const musicmetadata = require('musicmetadata');

//---- own ----
const {
  configFile,
  listSongs,
  langFile,
  editFile
} = require(path.join(__dirname, '../../../' ,'config')).init();
const worker = new Worker(path.join(__dirname, 'workerPaths.js')); 

/* --------------------------------- Variables --------------------------------- */
//---- normals ----
let lang = langFile[configFile.lang];
let songs = [];
let files = [];

/* --------------------------------- Functions --------------------------------- */
// Will get all this songs files.
// It will compare if there's more or few songs
function addSongFolder(folder, fnStart, fnIter) {
  // Get the object from listsong.json - only if was already created it
  songs = Object.keys(listSongs).length === 0 ? [] : listSongs;
  const readAllFiles = readFiles => {
    if (readFiles.length) { // Add songs
      files = readFiles.map(f => path.normalize(f));
      fnStart();
      extractMetadata(fnIter);
    }
  };
  readParentFolder(folder, readAllFiles);
}

// Will get all the needed metadata from a song file
function extractMetadata(fnIter) {
  let count = 0;
  files.forEach(f => {
    musicmetadata(fs.createReadStream(f), (error, data) => {
      count++;
      // In case of empty data, it will save data using what is inside the lang.json file
      songs.push(
        {
          artist: spaceToNbsp(data.artist.length === 0 || error ? lang.artist : data.artist[0]),
          album: spaceToNbsp(data.album.trim().length === 0 || error ?  lang.album : data.album),
          title: spaceToNbsp(data.title.trim().length === 0 || error ? lang.title : data.title),
          filename: f
        }
      );
      fnIter(count, files.length);
    });
  });
}

function updateSongList() {
  // Works fine with English and Spanish words. Don't know if it's fine for others languages :(
  editFile('listSong', songs.sort((a, b) =>
    a.artist.toLowerCase().normalize('NFC') < b.artist.toLowerCase().normalize('NFC') ? - 1 :
    a.artist.toLowerCase().normalize('NFC') > b.artist.toLowerCase().normalize('NFC')
  ).map((v, i) => (v.position = i, v)));
}

function removeSongFolder(folder) {
  // Get the object from listsong.json - only if was already created it
  const readAllFiles = readFiles => {
    songs = [];
    listSongs.forEach((f, i, a) => {
      if (readFiles.find(v => v === f.filename)) delete a[i];
      else songs.push(f);
    });

    updateSongList();
  };

  readParentFolder(folder, readAllFiles);
}

function readParentFolder(folder, fn) {
  // command line [Linux | Mac]
  if (process.platform === 'darwin' || process.platform === 'linux') {
    const command = `find ${path.normalize(folder.replace(/\b\s{1}/g, '\\ '))} -type f | grep -E \"\.(mp3|wmv|wav|ogg)$\"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        ipcRenderer.send('display-msg', {
          type: 'info',
          message: lang.alerts.error_003,
          detail: stderr,
          buttons: ['Ok']
        });

        return;
      }

      fn(stdout.trim().split('\n'));
    });
  } else if (process.platform === 'win32') {
    // // Only for windows
    worker.postMessage({ 'folder': folder });
    worker.onmessage = e => fn(e.data.files.split('|'));
  }
}

function spaceToNbsp(str) {
  return str.trim().replace(/\s/g, '&nbsp;');
}

module.exports = Object.freeze({
  removeSongFolder,
  updateSongList,
  addSongFolder
});