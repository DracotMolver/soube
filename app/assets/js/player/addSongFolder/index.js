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
const dialog = require('electron').remote.dialog;

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
  const RGX_EXT = /(\.mp3|\.wmv|\.wav|\.ogg)$/ig;

  fs.readdirSync(dir).forEach(files => {
    // Based folders
    baseFolder = path.join(dir, files);
    if (fs.lstatSync(baseFolder).isDirectory()) {
      folders.push(baseFolder);
    } else if (fs.lstatSync(baseFolder).isFile() && RGX_EXT.test(files)) {
      allFiles.push(baseFolder);
    }
  });

  foldersSize = folders.length - 1;
  while (foldersSize > -1) {
    fs.readdirSync(folders[foldersSize]).forEach(files => {
      baseFolder = path.join(folders[foldersSize], files);
      if (fs.lstatSync(baseFolder).isDirectory()) {
        tmpFolders.push(baseFolder);
      } else if (fs.lstatSync(baseFolder).isFile() && RGX_EXT.test(files)) {
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
    if (songs.length < readFiles.length) { // Add songs
      files = readFiles.filter(f => {
        if (songs.find(v => v.filename === f) === undefined) return path.normalize(f);
      });

      fnStart();
      extractMetadata(fnIter);
    } else if(songs.length > readFiles.length) { // Remove songs
      songs = songs.filter(f => {
        if (readFiles.find(v => v === f.filename)) return f;
      }).map((v, i) => (v.position = i, v));

      editFile('listSong', songs);
      window.location.reload(true);
    }
  };

  // command line [Linux | Mac]
  if (process.platform === 'darwin' || process.platform === 'linux') {
    const command = `find ${path.normalize(folder)} -type f | grep -E \"\.(mp3|wmv|wav|ogg)$\"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        dialog.showErrorBox('Error [003]', `${lang.alerts.error_003} ${folder}\n${stderr}`);
        return;
      }

      readAllFiles(stdout.trim().split('\n'));
    });
  } else if (process.platform === 'win32') {
    // Only for windows
    readAllFiles(findFiles(folder));
  }
}

// Will get all the needed metadata from a song file
function extractMetadata(fnIter) {
  (function(f) {
    let asyncForEach = {
      init: 0,
      end: 0,
      loop: () => {
        if (asyncForEach.init < asyncForEach.end) {
          musicmetadata(fs.createReadStream(f[asyncForEach.init]), (error, data) => {
            // In case of error, it will save data using what is inside the lang.json file
            songs.push(
              error ?
              {
                artist: lang.artist.trim().replace(/\s/g, '&nbsp;'),
                album: lang.album.trim().replace(/\s/g, '&nbsp;'),
                title: lang.title.trim().replace(/\s/g, '&nbsp;'),
                filename: f[asyncForEach.init]
              } :
              {
                artist: (data.artist.length !== 0 ? data.artist[0] : lang.artist).trim().replace(/\s/g, '&nbsp;'),
                album: (data.album.trim().length !== 0 ? data.album : lang.album).trim().replace(/\s/g, '&nbsp;'),
                title: (data.title.trim().length !== 0 ? data.title : lang.title).trim().replace(/\s/g, '&nbsp;'),
                filename: f[asyncForEach.init]
              }
            );

            fnIter(asyncForEach.init + 1, asyncForEach.end);
            if (asyncForEach.init + 1 === asyncForEach.end) {
              editFile('listSong',
                songs.sort((a, b) =>
                  // Works fine with English and Spanish words. Don't know if it's fine for others languages :(
                  a.artist.toLowerCase().normalize('NFC') < b.artist.toLowerCase().normalize('NFC') ? - 1 :
                  a.artist.toLowerCase().normalize('NFC') > b.artist.toLowerCase().normalize('NFC')
                ).map((v, i) => (v.position = i, v))
              );
            } else {
              asyncForEach.init++;
              asyncForEach.loop();
            }
          });
        }
      },
      steps: (init, end) => {
        asyncForEach.end = end;
        asyncForEach.init = init;
      }
    };

    asyncForEach.steps(0, f.length);
    asyncForEach.loop();
  })(files);
}

module.exports = addSongFolder;