// Módulos
const ListSongs = require('./listSongs')()
const PlayFile = require('./playFile')()
const {
  ipcRenderer,
  metaData,
  execFile,
  dialog,
  fs
} = require('./commons')

// Funciones para reproducir las canciones
const playSong = PlayFile('playSong')
const nextSong = PlayFile('nextSong')
const setSongs = PlayFile('setSongs')
// let setEqualizer = PlayFile('setFilterVal')

// funciones para crear el listado de canciones
const setNextSongFunction = ListSongs('setNextSongFunction')
const createDefaultListView = ListSongs('createDefaultListView')

// Variables
let isInputSearchDisplayed = false // Validar si se ha pulsado (ctrl | cmd) + f
let inputRegexSearch = null // Nombre de la canción a buscar
let _songs = null // Canciones cargadas
let _listTotal = null // Listado html de las canciones desplegadas en el front
let _list = null // Listado html de las canciones desplegadas en el front
let _p = '' // Recibe el valor devuelto por la función playSong
let newSongs = [] // Posibles nuevas canciones agregadas
let iterator = {} // Resultado del iterador sobre las canciones
let count = 0
let newSongsSize = 0
let inputSearchValue = ''

// Para generar la animación del botón play
const anim = {
  from: ['M 5.827315,6.7672041 62.280287,48.845328 62.257126,128.62684 5.8743095,170.58995 Z',
        'm 61.189203,48.025 56.296987,40.520916 0,0.0028 -56.261916,40.850634 z'],
  to: ['M 5.827315,6.7672041 39.949651,6.9753863 39.92649,170.36386 5.8743095,170.58995 Z',
      'm 83.814203,6.9000001 34.109487,0.037583 -0.0839,163.399307 -33.899661,0.16304 z']
}

// Configuraciones
let configFile = jread(CONFIG_FILE)
let lang = jread(LANG_FILE)[configFile.lang]
let alerts = lang.alerts

// Activar shuffle
if (configFile.shuffle) $('#shuffle-icon', {css: 'fill: #FBFCFC'})

/**
 * Una de las funciones importantes.
 * Se encarga de verificar si hay canciones que mostrar y arma lo
 * necesario para que el reproductor funciones
 */
function loadSongStuffs () {
  _songs = jread(SONG_FILE)
  if (Object.keys(_songs).length === 0) {
    $('#list-songs', {
      addText: `<div id="init-message">${alerts.welcome}</div>`
    })
  } else {
    checkNewSongs()
    setSongs(_songs)
    setNextSongFunction(nextSong) // Compartimos la función nextSong para el evento onclick en el listado de canciones
    createDefaultListView() // Desplegamos el listado de canciones con el estilo por defecto de tipo lista
  }
}

/**
 * Función iteradora que retorna la ruta de la canción
 *
 * @return objeto iteratodr {object} -  {value: 'nombre de la canción', done: true | false}
 */
function * readSongs () {
  while (newSongsSize--) yield newSongs[newSongsSize]
}

/**
 * Usamos MUSICMETADATA de @leetreveil npm
 *
 * @var iter {Objet} - Objeto iterador de la función generadora readSongs
 */
function getMetadata (iter) {
  $('#new-songs-pop-up', {
    addText: `${alerts.newSongsFound}${count++} / ${newSongs.length}`
  })

  // Retorn {value: 'nombre de la canción', done: true | false}
  iterator = iter.next()
  if (!iterator.done && iterator.value !== undefined) {
    // Extraer metadatas de los archivos de audio
    metaData(fs.createReadStream(iterator.value), function metaDataExtract (error, data) {
      // Agregar las nuevas canciones al objeto _songs
      // En caso de error, generar atributos de la canción con un valor en el idioma correspondiente
      if (error) {
        _songs.push({
          artist: lang.artist.replace(/\s+/ig, '&nbsp;'),
          album: lang.album.replace(/\s+/ig, '&nbsp;'),
          title: lang.title.replace(/\s+/ig, '&nbsp;'),
          filename: iterator.value
        })
      } else {
        _songs.push({
          artist: (data.artist[0] !== undefined || data.artist.length !== 0 ? data.artist[0] : lang.artist).replace(/\s+/ig, '&nbsp;'),
          album: (data.album !== undefined || data.album !== '' ? data.album : lang.album).replace(/\s+/ig, '&nbsp;'),
          title: (data.title !== undefined || data.title !== '' ? data.title : lang.title).replace(/\s+/ig, '&nbsp;'),
          filename: iterator.value
        })
      }
      getMetadata(iter)
    })
  } else {
    _songs = jsave(SONG_FILE, _songs)
    // Ocultar pop-up
    $('#new-songs-pop-up-container', {addClass: 'hide'})
    return
  }
}

/**
 * Chequear si hay nuevas canciones en el direcctorio para que sean agregadas
 */
function checkNewSongs () {
  execFile('find', [lang.config.statusSongFolder], (error, stdout, stderr) => {
    if (error) {
      dialog.showErrorBox('Error [003]', `${alerts.error_003} ${lang.config.statusSongFolder} :: ${stderr}`)
      return
    } else {
      newSongs = stdout.split('\n').filter(f => {
        if (/(\.mp3|\.wav|\.wave|\/)/.test(f.slice(f.lastIndexOf('.'), f.length))) {
          // Buscar en el objeto de canciones si no exíste la canción dada
          if (_songs.find(v => v.filename === f) === undefined) return f
        }
      })

      if ((newSongsSize = newSongs.length) > 0) {
        // Desplegar pop-up
        $('#new-songs-pop-up-container', {rmClass: 'hide'})
        $('#new-songs-pop-up', {addClass: 'new-songs-pop-up-anim'})

        getMetadata(readSongs())
      }
    }
  })
}

// Iniciar todo lo necesario para desplegar en la interfaz
// Vendría siendo el método init
fs.access(SONG_FILE, fs.F_OK | fs.R_OK, error => {
  if (error) {
    dialog.showErrorBox('Error [001]', `${alerts.error_001}`)
    return
  } else {
    $('#list-songs', {addText: ''})
    loadSongStuffs()
  }
})

// Generar el listado de canciones cuando se han cargado desde el panel de configuraciones
// El llamdo se hace desde el main.js
ipcRenderer.on('order-display-list', () => {
  $('#list-songs', {addText: ''})
  loadSongStuffs()
})

// Abrir ventana de configuración
$('#config', {
  click: () => {
    ipcRenderer.send('show-config')
  }
})

 // Acciones sobre los botones del menú superior.
 // play, prev, next & shuffles
function clickBtnControls () {
  $(this, {addClass: 'click-controlls'})

  if (_songs !== null) {
    switch (this.id) {
      case 'play-pause':
        _p = playSong()
        if (_p === 'resume')
          $('.anim-play').forEach((v, i) => {
            $(v, {attr: ['from', anim.from[i]]})
            $(v, {attr: ['to', anim.to[i]]})
            v.beginElement()
          })
        else if (_p === 'paused')
          $('.anim-play').forEach((v, i) => {
            $(v, {attr: ['from', anim.to[i]]})
            $(v, {attr: ['to', anim.from[i]]})
            v.beginElement()
          })
        break
      case 'next': nextSong(); break
      case 'shuffle':
        $('#shuffle-icon', {css: (configFile.shuffle ? 'fill:#FBFCFC' : 'fill:#f06292')})
        configFile.shuffle = !configFile.shuffle
        configFile = jsave(CONFIG_FILE, configFile)
        break
    }
  } else {
    dialog.showMessageBox({
      type: 'info',
      buttons: ['Ok'],
      message: alerts.error_002
    })
  }
}

// Detectar terminio de la animación al haber dado click sobre un icono
function endAnimBtnControlls () {
  $(this, {rmClass: 'click-controlls'})
}

$('.btn-controlls').forEach(v => {
  $(v, {click: clickBtnControls, animEnd: endAnimBtnControlls})
})

// Configurar el equalizador.
// ipcRenderer.on('get-equalizer-filter', (e, a) => {
//   setEqualizer(...a)
// })

// Desplegar input search para buscar canciones, artistas, o album
// Registrar un shorcut
function searchInputData (e) {
  inputSearchValue = this.value

  if (e.key === 'ArrowRight' && inputSearchValue.length > 1)
    this.value = $('#input-search-result').textContent

  if (e.key === 'Enter') {
    // Reproduce la canción buscada
    nextSong($(_list[0], {getData: ['position', 'int']}))
    // Anima el botón play
    $('.anim-play').forEach((v, i) => {
      $(v, {attr: ['from', anim.from[i]]})
      $(v, {attr: ['to', anim.to[i]]})
      v.beginElement()
    })
    $('#input-search-result', {addText: ''})
    $('#search-container', {addClass: 'hide'})
    $('#search-wrapper', {rmClass: 'search-wrapper-anim'})
    $('.grid-container', {rmAttr: 'style'})
    $('#input-search', {rmClass: 'input-search-anim'})
    isInputSearchDisplayed = false
  }

  inputRegexSearch = new RegExp(`^${inputSearchValue.replace(/\s/g, '&nbsp;')}`, 'img')
  _list = _listTotal.filter(v => inputRegexSearch.test($(v, {getData: ['title', 'string']})))

  $('#input-search-result', {
    addText: _list.length > 0 && inputSearchValue.length > 0 ? $(_list[0], {getData: ['title', 'string']}) : ''
  })
}

ipcRenderer.on('input-search-song', () => {
  if (!isInputSearchDisplayed) {
    _listTotal = $('#list-songs', {getChild: 'all'})
    $('#search-container', {rmClass: 'hide'})
    $('#search-wrapper', {addClass: 'search-wrapper-anim'})
    $('.grid-container', {css: '-webkit-filter: blur(2px)'})
    $('#input-search', {addClass: 'input-search-anim', keyup: searchInputData}).focus()
    isInputSearchDisplayed = true
  }
})
