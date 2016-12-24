/**
 * @author Diego Alberto Molina Vera
 */
/* --------------------------------- Módulos --------------------------------- */
// Node módulos
const fs = require('fs');
const exec = require('child_process').exec;
const path = require('path');

// Electron módulos
const dialog = require('electron').remote.dialog;

// Otros
const musicmetadata = require('musicmetadata');

// Módulos propios
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

/* --------------------------------- Funciones --------------------------------- */
// Lista el total de archivos y sub-archivos
function findFiles(dir) {
  let allFiles = [];
  let tmpFolders = [];
  let foldersSize = 0;
  let folders = [];
  const rgxExt = /(\.mp3|\.wmv|\.wav|\.ogg)$/ig;

  fs.readdirSync(dir).forEach(files => {
    // Carpetas bases.
    // Obtener todas las carpetas
    if (fs.lstatSync(`${dir}/${files}`).isDirectory()) {
      folders.push(`${dir}/${files}`);
    } else if (fs.lstatSync(`${dir}/${files}`).isFile() && rgxExt.test(files)) {
      // Obtener todos los archivos con las extensiones definidas.
      allFiles.push(`${dir}/${files}`);
    }
  });

  foldersSize = folders.length - 1;
  while (foldersSize > -1) {
    fs.readdirSync(folders[foldersSize]).forEach(files => {
      if (fs.lstatSync(`${folders[foldersSize]}/${files}`).isDirectory()) {
        tmpFolders.push(`${folders[foldersSize]}/${files}`);
      } else if (fs.lstatSync(`${folders[foldersSize]}/${files}`).isFile() && rgxExt.test(files)) {
        allFiles.push(`${folders[foldersSize]}/${files}`);
      }
    });

    folders.pop();
    folders = folders.concat(tmpFolders);
    foldersSize = folders.length - 1;
  }

  return allFiles;
}

function addSongFolder(folder, fnStart, fnIter) {
  // Rescatar el objeto que contiene el archivo listsong.json
  songs = Object.keys(listSongs).length === 0 ? [] : listSongs;

  const readAllFiles = readFiles => {
    // Verificar que las canciones guardadas son la misma cantidad
    // que las que hay en la carpeta de música.
    // De lo contrario hay dos opciones:
    //  1.- Borrar las canciones que sobran en caso de haber más [metaDataSongs > readFiles]
    //  2.- Agregar las canciones nuevas [metaDataSongs < readFiles]
    if (songs.length < readFiles.length) { // Agregar
      files = readFiles.filter(f => {
        if (songs.find(v => v.filename === f) === undefined) return path.normalize(f);
      });

      if (files.length > 0) {
        fnStart();
        extractMetadata(fnIter);
      }
    } else if(songs.length > readFiles.length) { // Borrar
      songs = songs.filter(f => {
        if (readFiles.find(v => v === f.filename)) return f;
      });

      editFile('listSong', songs);
      window.location.reload(true);
    }
  };

  // NOTA: Para windows debemos usar un método recursivo [dir es muy limitado y findstr también].
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
    readAllFiles(findFiles(folder));
  }
}

function extractMetadata(fnIter, fnEnd) {
  let readStream = null;
  songs = [];
  files.forEach(v => {
    musicmetadata(fs.createReadStream(v), (error, data) => {
      // En caso de error, generar atributos de la canción con un valor en el idioma correspondiente
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