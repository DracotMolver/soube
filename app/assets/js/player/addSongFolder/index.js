/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
//---- nodejs ----
const fs = require('fs');
const exec = require('child_process').exec;
const path = require('path');

//---- electron ----
const ipcRenderer = require('electron').ipcRenderer;

//---- other ----
const musicmetadata = require('musicmetadata');

//---- own ----
let {
  configFile,
  langFile,
  listSongs,
  editFile
} = require('./../../config').init();

/* --------------------------------- Variables --------------------------------- */
//---- normals ----
let lang = langFile[configFile.lang];
let songs = [];
let files = [];

/* --------------------------------- Functions --------------------------------- */
// List of files and sub-files
// In this way, we avoid to use recursion
function findFiles(dir) {
  let allFiles = [];
  let tmpFolders = [];
  let foldersSize = 0;
  let folders = [];
  let baseFolder = '';

  fs.readdirSync(dir).forEach(files => {
    // Based folders
    baseFolder = path.join(dir, files);
    if (fs.lstatSync(baseFolder).isDirectory()) {
      folders.push(baseFolder);
    } else if (fs.lstatSync(baseFolder).isFile() && /\.(mp3|wmv|wav|ogg)$/ig.test(baseFolder.trim())) {
      allFiles.push(baseFolder);
    }
  });

  foldersSize = folders.length - 1;
  var count = 0;
  while (foldersSize > -1) {
    fs.readdirSync(folders[foldersSize]).forEach(files => {
      baseFolder = path.join(folders[foldersSize], files);
      if (fs.lstatSync(baseFolder).isDirectory()) {
        tmpFolders.push(baseFolder);
      } else if (fs.lstatSync(baseFolder).isFile() && /\.(mp3|wmv|wav|ogg)$/ig.test(baseFolder.trim())) {
        allFiles.push(baseFolder);
      }
    });

    folders.pop();
    folders = folders.concat(tmpFolders);
    foldersSize = folders.length - 1;
  }

  return allFiles;
}

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
        error ?
        {
          artist: lang.artist.trim().replace(/\s/g, '&nbsp;'),
          album: lang.album.trim().replace(/\s/g, '&nbsp;'),
          title: lang.title.trim().replace(/\s/g, '&nbsp;'),
          filename: f
        } :
        {
          artist: (data.artist.length !== 0 ? data.artist[0] : lang.artist).trim().replace(/\s/g, '&nbsp;'),
          album: (data.album.trim().length !== 0 ? data.album : lang.album).trim().replace(/\s/g, '&nbsp;'),
          title: (data.title.trim().length !== 0 ? data.title : lang.title).trim().replace(/\s/g, '&nbsp;'),
          filename: f
        }
      );
      fnIter(count, files.length);
    });
  });
}

function updateSongList() {
  editFile('listSong', songs.sort((a, b) =>
    // Works fine with English and Spanish words. Don't know if it's fine for others languages :(
    a.artist.toLowerCase().normalize('NFC') < b.artist.toLowerCase().normalize('NFC') ? - 1 :
      a.artist.toLowerCase().normalize('NFC') > b.artist.toLowerCase().normalize('NFC')
  ).map((v, i) => (v.position = i, v)));
}

function removeSongFolder(folder) {
  // Get the object from listsong.json - only if was already created it
  const readAllFiles = readFiles => {
    songs = listSongs.filter(f => {
      if (readFiles.find(v => v !== f.filename)) return f;
    });

    console.log(songs)
    // updateSongList();
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
    // Only for windows
    fn(findFiles(folder));
  }
}

module.exports = Object.freeze({
  removeSongFolder,
  addSongFolder,
  updateSongList
});