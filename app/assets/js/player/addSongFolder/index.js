/**
 * @author Diego Alberto Molina Vera
 */
/* --------------------------------- Modules --------------------------------- */
// Nodejs modules
const fs = require('fs');
const exec = require('child_process').exec;
const path = require('path');

// Electron modules
const dialog = require('electron').remote.dialog;

// Others
const musicmetadata = require('musicmetadata');

// Own modules
let {
  configFile,
  langFile,
  listSongs,
  editFile
} = require('./../../config').init();

/* --------------------------------- Variables --------------------------------- */
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
  const RGX_EXT = /(\.mp3|\.wmv|\.wav|\.ogg)$/ig;

  fs.readdirSync(dir).forEach(files => {
    // Based folders.
    if (fs.lstatSync(`${dir}/${files}`).isDirectory()) {
      folders.push(`${dir}/${files}`);
    } else if (fs.lstatSync(`${dir}/${files}`).isFile() && RGX_EXT.test(files)) {
      allFiles.push(`${dir}/${files}`);
    }
  });

  foldersSize = folders.length - 1;
  while (foldersSize > -1) {
    fs.readdirSync(folders[foldersSize]).forEach(files => {
      if (fs.lstatSync(`${folders[foldersSize]}/${files}`).isDirectory()) {
        tmpFolders.push(`${folders[foldersSize]}/${files}`);
      } else if (fs.lstatSync(`${folders[foldersSize]}/${files}`).isFile() && RGX_EXT.test(files)) {
        allFiles.push(`${folders[foldersSize]}/${files}`);
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
    if (songs.length < readFiles.length) { // Add songs
      files = readFiles.filter(f => {
        if (songs.find(v => v.filename === f) === undefined) return path.normalize(f);
      });

      if (files.length > 0) {
        fnStart();
        extractMetadata(fnIter);
      }
    } else if(songs.length > readFiles.length) { // Remove songs
      songs = songs.filter(f => {
        if (readFiles.find(v => v === f.filename)) return f;
      });

      editFile('listSong', songs);
      window.location.reload(true);
    }
  };

  // Ejecutar linea de comando [Linux | Mac]
  if (process.platform === 'darwin' || process.platform === 'linux') {
    const command = `find ${folder} -type f | grep -E \"\.(mp3|wmv|wav|ogg)$\"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        dialog.showErrorBox('Error [003]', `${lang.alerts.error_003} ${folder}\n${stderr}`);
      } else {
        readAllFiles(stdout.trim().split('\n'));
      }
    });
  } else if (process.platform === 'win32') {
    // Only for windows
    readAllFiles(findFiles(folder));
  }
}

// Will get all the needed metadata from a song file
function extractMetadata(fnIter, fnEnd) {
  let readStream = null;
  songs = [];
  files.forEach(v => {
    musicmetadata(fs.createReadStream(v), (error, data) => {
      // In case of error, it will save data using what is inside the lang.json file
      songs.push(
        error ?
        {
          artist: lang.artist.trim().replace(/\s/g, '&nbsp;'),
          album: lang.album.trim().replace(/\s/g, '&nbsp;'),
          title: lang.title.trim().replace(/\s/g, '&nbsp;'),
          filename: v,
          position: songs.length
        } :
        {
          artist: (data.artist.length !== 0 ? data.artist[0] : lang.artist).trim().replace(/\s/g, '&nbsp;'),
          album: (data.album.trim().length !== 0 ? data.album : lang.album).trim().replace(/\s/g, '&nbsp;'),
          title: (data.title.trim().length !== 0 ? data.title : lang.title).trim().replace(/\s/g, '&nbsp;'),
          filename: v,
          position: songs.length
        }
      );

      fnIter(songs.length, files.length);
      if (songs.length === files.length) {
        editFile('listSong', songs);
      }
    });
  });
}

module.exports = addSongFolder;