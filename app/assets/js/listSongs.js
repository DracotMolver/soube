/**
 * -------------------------- Módulo ListSongs -------------------------- *
 * @author Diego Alberto Molina Vera
 *
 * Se encarga de generar el listado de canciones en HTML
 * en dos formatos. El formato por default es por lista y el otro es por
 * artista/albunes
 */
/** ---------------------------- Varibles ---------------------------- **/
const {
  execFile,
  metaData,
  dialog,
  path,
  fs
} = require('./commons')

let clickNextSong = null // Almacena la función nextSong del archivo playFile.js
let metaDataSongs = []
let iterator = {}
let songSize = 0
let fnStart = null
let fnIter = null
let files = []
let count = 0
let fnEnd = null
let max = 0

// Archivos de configuraciones
let configFile = jread(CONFIG_FILE) // Archivo de configuraciones
let lang = jread(LANG_FILE)[configFile.lang] // Archivo de mensajes en disintos idiomas

/** ---------------------------- Funciones ---------------------------- **/
/**
 * Recibe la función nextSong del archivo PlayFile.js para reproducir una canción
 *
 * @var _function {Function} - Recibe función nextSong
 */
function setNextSongFunction(_function) {
  clickNextSong = _function
}

/**
 * Obtiene la posición de la canción seleccionada de la lista
 * Se negera la animación del botón play
 */
function getDataSongAtPosition() {
  clickNextSong($(this).data('position', 'int'))
  const anim = {
    from: [
      'M 5.827315,6.7672041 62.280287,48.845328 62.257126,128.62684 5.8743095,170.58995 Z',
      'm 61.189203,48.025 56.296987,40.520916 0,0.0028 -56.261916,40.850634 z'
    ],
    to: [
      'M 5.827315,6.7672041 39.949651,6.9753863 39.92649,170.36386 5.8743095,170.58995 Z',
      'm 83.814203,6.9000001 34.109487,0.037583 -0.0839,163.399307 -33.899661,0.16304 z'
    ]
  }

  $('.anim-play').each((v, i) => {
    $(v).attr({ 'from': anim.from[i], 'to': anim.to[i] })[0].beginElement()
  })
}

/**
 * Generará la vista del listado de canciones por defecto
 */
function createDefaultListView() {
  // Contenedor que se reptite para el títutlo, artista y album
  let child = $.clone('div', false).addClass('grid-33 mobile-grid-33 song-info').css('overflow:hidden;')
  let title = null
  let album = null
  let artist = null
  let parentContainer = $.clone('div', false).addClass('grid-100')
  const f = document.createDocumentFragment()

  jread(SONG_FILE).forEach((v, i) => {
    title = $.clone(child, true).text(v.title) // Título de la canción
    artist = $.clone(child, true).text(`<span class="miscelaneo">by</span>${v.artist}`) // Artista
    album = $.clone(child, true).text(`<span class="miscelaneo">from</span>${v.album}`) // Album

    f.appendChild(
      $.clone(parentContainer, true)
      .data({
        position: i,
        artist: v.artist,
        title: v.title,
        album: v.album,
        url: v.filename
      }).insert(title, artist, album).on({ 'click': getDataSongAtPosition })[0]
    )
  })

  $('#list-songs').insert(f)
}

/**
 * Función generadora que retorna el la ruta del archivo a leer
 */
function* getSongs() { while (songSize--) yield files[songSize] }

/**
 * Revisa si hay nuevas canciones para ingresar.
 * Para saber qué sucede dentro de la ejecución de esta función,
 * se resiven tres funciones como parámetros
 * 
 * @var folder {String} - Nombre de la carpeta a revisar
 * @var _fnStart {Function} - Función que se ejecutará previo a la lectura de metadatos
 * @var _fnEnd {Function} - Retorna un valor al final de la ejecución de este función
 * @var _fnIter {Function} - Solo se ejecuta cuando hay archivos de los cuales extraer metadatos
 */
function getMetadata(folder, _fnStart, _fnEnd, _fnIter) {
  fnStart = _fnStart
  fnIter = _fnIter
  fnEnd = _fnEnd

  // Rescatar el objeto que contiene el archivo listsong.json
  let songs = Object.keys(jread(SONG_FILE)).length === 0 ? [] : jread(SONG_FILE)
  if (songs.length > 0) metaDataSongs = songs
 
  files = []
  execFile('find', [folder], (error, stdout, stderr) => {
    if (error) {
      dialog.showErrorBox('Error [003]', `${lang.alerts.error_003} ${folder}\n${stderr}`)
      return
    } else {
      files = stdout.split('\n').filter(f => {
        if (/(\.mp3|\.wav|\.wave|\.wma|\.wmv|\.ogg|\.m4a)/.test(f.slice(f.lastIndexOf('.'), f.length)))
          if (songs.find(v => v.filename === f) === undefined) return path.normalize(f)
      })

      songSize = max = files.length
      if (songSize > 0) {
        fnStart()
        extractMetadata(getSongs())
      } else {
        fnEnd(songs)
      }
    }
  })
}

/**
 * Extrae los datos de las canciones.
 * Usamos MUSICMETADATA de @leetreveil - npm
 *
 * @var iter {Iterador} - Iterador devuelto por la funcion generador
 */
function extractMetadata(iter) {
  fnIter(++count, max)
  iterator = iter.next()
  if (!iterator.done && iterator.value !== undefined) {
    // Extraer metadatas de los archivos de audio
    metaData(fs.createReadStream(iterator.value), (error, data) => {
      // En caso de error, generar atributos de la canción con un valor en el idioma correspondiente
      metaDataSongs.push(
        error ?
          {
            artist: lang.artist.replace(/\s/g, '&nbsp;'),
            album: lang.album.replace(/\s/g, '&nbsp;'),
            title: lang.title.replace(/\s/g, '&nbsp;'),
            filename: iterator.value,
            position: metaDataSongs.length
          } :
          {
            artist: (data.artist.length !== 0 ? data.artist[0] : lang.artist).replace(/\s/g, '&nbsp;'),
            album: (data.album.trim().length !== 0 ? data.album : lang.album).replace(/\s/g, '&nbsp;'),
            title: (data.title.trim().length !== 0 ? data.title : lang.title).replace(/\s/g, '&nbsp;'),
            filename: iterator.value,
            position: metaDataSongs.length
          }
      )
      extractMetadata(iter)
    })
  } else {
    fnEnd(jsave(SONG_FILE, metaDataSongs))
    return
  }
}

module.exports = {
  setNextSongFunction,
  createDefaultListView,
  getMetadata
}
