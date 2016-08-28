require('./commons')
/**
 * -------------------------- Módulo ListSongs -------------------------- *
 *
 * Se encarga de generar el listado de canciones en HTML
 * en dos formatos. El formato por default es por lista y el otro es por
 * artista/albunes
 */
/** ---------------------------- Varibles ---------------------------- **/
let clickNextSong = null // Almacena la función nextSong del archivo playFile.js

/** ---------------------------- Funciones ---------------------------- **/
/**
 * Recibe la función nextSong del archivo PlayFile.js para reproducir una canción
 *
 * @var _function {Function} - Recibe función nextSong
 */
function setNextSongFunction (_function) {
  clickNextSong = _function
}

/**
 * Obtiene la posición de la canción seleccionada de la lista
 */
function getDataSongAtPosition () {
  clickNextSong($(this, {getData: ['position', 'int']}))
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

  $('.anim-play').forEach((v, i) => {
    $(v, {attr: ['from', anim.from[i], 'to', anim.to[i]]}).beginElement()
  })
}

/**
 * Generará la vista del listado de canciones por defecto
 */
function createDefaultListView () {
  // 1.- div -> Contenedor
  // 2.- div -> Canción
  // 4.- div -> Artista
  // 4.- div -> Album
  const elements = $(['div', 'div', 'div', 'div']) // Crear los elementos a usar
  const parent = elements.shift()
  let childs = elements
  let f = document.createDocumentFragment()
  let childsAttr = null

  // Se inicia la estructura <li> con los datos de las canciones
  const _f = jread(SONG_FILE).map((v, i) => {
    // Preparar el contenedo de los elementos <h4> y <h5>
    childsAttr = [
      {clone: 'div', addText: v.title, addClass: 'grid-33 mobile-grid-33 song-info'},
      {clone: 'div', addText: `<span class="miscelaneo">by</span>${v.artist}`, addClass: 'grid-33 mobile-grid-33 song-info'},
      {clone: 'div', addText: `<span class="miscelaneo">from</span>${v.album}`, addClass: 'grid-33 mobile-grid-33 song-info'}
    ]

    f.appendChild(
      $(parent, {
        clone: 'div',
        addClass: 'grid-100',
        setData: {
          url: v.filename,
          title: v.title,
          artist: v.artist,
          album: v.album,
          duration: v.duration,
          position: i
        },
        addTo: childs.map((t, i) => $(t, childsAttr[i])),
        on: {
          'click': getDataSongAtPosition
        }
      })
    )
    return f
  })
  $('#list-songs', {addTo: _f})
}

module.exports = Object.freeze({
  setNextSongFunction,
  createDefaultListView
})
