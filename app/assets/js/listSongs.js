/**
 * -------------------------- Módulo ListSongs -------------------------- *
 * @author Diego Alberto Molina Vera
 *
 * Se encarga de generar el listado de canciones en HTML
 * en dos formatos. El formato por default es por lista y el otro es por
 * artista/albunes
 */
/** ---------------------------- Varibles ---------------------------- **/
const exec = require('child_process').exec;
const metaData = require('musicmetadata');
const path = require('path');
const fs = require('fs');
const { dialog } = require('electron').remote;
require('./commons');

let clickNextSong = null; // Almacena la función nextSong del archivo playFile.js
let metaDataSongs = [];
let iterator = {};
let songSize = 0;
let fnStart = null;
let fnIter = null;
let files = [];
let count = 0;
let fnEnd = null;
let max = 0;

// Archivos de configuraciones
let configFile = jread(CONFIG_FILE); // Archivo de configuraciones
let lang = jread(LANG_FILE)[configFile.lang]; // Archivo de mensajes en disintos idiomas

/** ---------------------------- Funciones ---------------------------- **/
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

// Recibe la función nextSong del archivo PlayFile.js para reproducir una canción
function setNextSongFunction(_function) {
  clickNextSong = _function;
}

// Obtiene la posición de la canción seleccionada de la lista
// para generar la animación del botón play
function getDataSongAtPosition() {
  clickNextSong($(this).data('position', 'int'));
  const anim = {
    from: [
      'M 5.827315,6.7672041 62.280287,48.845328 62.257126,128.62684 5.8743095,170.58995 Z',
      'm 61.189203,48.025 56.296987,40.520916 0,0.0028 -56.261916,40.850634 z'
    ],
    to: [
      'M 5.827315,6.7672041 39.949651,6.9753863 39.92649,170.36386 5.8743095,170.58995 Z',
      'm 83.814203,6.9000001 34.109487,0.037583 -0.0839,163.399307 -33.899661,0.16304 z'
    ]
  };

  $('.anim-play').each((v, i) => {
    v.attr({ 'from': anim.from[i], 'to': anim.to[i] })[0].beginElement();
  });
}

// Genera la vista del listado de canciones por defecto
function createDefaultListView() {
  // Contenedor que se reptite para el títutlo, artista y album
  const child = $.clone('div', false).addClass('grid-33 mobile-grid-33 song-info');
  const parentContainer = $.clone('div', false).addClass('list-song-container');
  const f = document.createDocumentFragment();
  let title = null;
  let album = null;
  let artist = null;

  jread(SONG_FILE).forEach((v, i) => {
    title = $.clone(child, true).text(v.title); // Título de la canción
    artist = $.clone(child, true).text(`<span class="miscelaneo">by</span>${v.artist}`); // Artista
    album = $.clone(child, true).text(`<span class="miscelaneo">from</span>${v.album}`); // Album

    f.appendChild(
      $.clone(parentContainer, true)
      .attr({id: i})
      .data({
        position: i,
        artist: v.artist,
        title: v.title,
        album: v.album,
        url: v.filename
      })
      .insert(title, artist, album)
      .on({ 'click': getDataSongAtPosition })[0]
    );
  });

  $('#list-songs').insert(f);
}

// Función generadora que retorna el la ruta del archivo a leer
const iter = (function* getSongs() {
  while (songSize--) yield files[songSize]
})();

/**
 * Revisa si hay nuevas canciones para ingresar
 * 
 * @var folder {String} - Nombre de la carpeta a revisar
 * @var _fnStart {Function} - Función que se ejecutará previo a la lectura de metadatos
 * @var _fnEnd {Function} - Retorna un valor al final de la ejecución de este función
 * @var _fnIter {Function} - Solo se ejecuta cuando hay archivos de los cuales extraer metadatos
 */
function getMetadata(folder, _fnStart, _fnEnd, _fnIter) {
  let command = '';
  files = [];
  fnStart = _fnStart;
  fnIter = _fnIter;
  fnEnd = _fnEnd;

  // Rescatar el objeto que contiene el archivo listsong.json
  let songs = Object.keys(jread(SONG_FILE)).length === 0 ? [] : jread(SONG_FILE);
  if (songs.length > 0) metaDataSongs = songs;

  // Para windows debemos usar un método recursivo [dir es muy limitado y findstr también].
  const readAllFiles = readFiles => {
      // Verificar que las canciones guardadas son la misma cantidad
      // que las que hay en la carpeta de música.
      // De lo contrario hay dos opciones:
      //  1.- Borrar las canciones que sobran en caso de haber más [metaDataSongs > readFiles]
      //  2.- Agregar las canciones nuevas [metaDataSongs < readFiles]
      if (metaDataSongs.length < readFiles.length) { // Agregar
        files = readFiles.filter(f => {
            if (songs.find(v => v.filename === f) === undefined) return path.normalize(f);
        });

        songSize = max = files.length;
        if (songSize > 0) {
          fnStart();
          extractMetadata();
        } else {
          return fnEnd(jsave(SONG_FILE, metaDataSongs));
        }
      } else if(metaDataSongs.length > readFiles.length) { // Borrar
        metaDataSongs =  metaDataSongs.filter(f => {
          if (readFiles.find(v => v === f.filename)) return f; 
        });
        window.location.reload(true);
      } else {
        return fnEnd(jsave(SONG_FILE, metaDataSongs));
      }
  };

  // Ejecutar linea de comando [Linux | Mac]
  if (process.platform === 'darwin' || process.platform === 'linux') {
    command = `find ${folder} -type f | grep -E \"\.(mp3|wmv|wav|ogg)$\"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        dialog.showErrorBox('Error [003]', `${lang.alerts.error_003} ${folder}\n${stderr}`);
        return;
      } else {
        readAllFiles(stdout.trim().split('\n'));
      }
    });
  } else if (process.platform === 'win32') {
    readAllFiles(findFiles(folder));
  }
}

// Extrae los datos de las canciones.
// Usamos MUSICMETADATA de @leetreveil - npm
function extractMetadata() {
  fnIter(++count, max);
  iterator = iter.next();
  if (!iterator.done && iterator.value !== undefined) {
    // Extraer metadatas de los archivos de audio
    metaData(fs.createReadStream(iterator.value), (error, data) => {
      // En caso de error, generar atributos de la canción con un valor en el idioma correspondiente
      metaDataSongs.push(
        error ?
          {
            artist: lang.artist.trim().replace(/\s/g, '&nbsp;'),
            album: lang.album.trim().replace(/\s/g, '&nbsp;'),
            title: lang.title.trim().replace(/\s/g, '&nbsp;'),
            filename: iterator.value,
            position: metaDataSongs.length
          } :
          {
            artist: (data.artist.length !== 0 ? data.artist[0] : lang.artist).trim().replace(/\s/g, '&nbsp;'),
            album: (data.album.trim().length !== 0 ? data.album : lang.album).trim().replace(/\s/g, '&nbsp;'),
            title: (data.title.trim().length !== 0 ? data.title : lang.title).trim().replace(/\s/g, '&nbsp;'),
            filename: iterator.value,
            position: metaDataSongs.length
          }
      );
      return avoidStack();
    })
  } else {
    return fnEnd(jsave(SONG_FILE, metaDataSongs));
  }
}

function avoidStack () {
  extractMetadata();
}

module.exports = Object.freeze({
  setNextSongFunction,
  createDefaultListView,
  getMetadata
});