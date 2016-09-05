/**
 * @author Diego Alberto Molina Vera
 */
/** -------------------------- Módulos ------------------------ **/
// Funciones para reproducir las canciones
const {
  playSong,
  nextSong,
  setSongs,
  setFilterVal,
  moveForward
} = require('./playFile')

// funciones para crear el listado de canciones
const {
  setNextSongFunction,
  createDefaultListView
} = require('./listSongs')

// Generales
const {
  ipcRenderer,
  metaData,
  execFile,
  dialog,
  fs
} = require('./commons')

/** -------------------------- Variables ------------------------ **/
// Busqueda de canciones
let searchResultsElements = $(['div', 'div', 'div'])
let isSearchDisplayed = false // Validar si se ha pulsado (ctrl | cmd) + f
let searchValue = ''
let countSearch = 0
let fragContRes = null
let searchRgx = null // Nombre de la canción a buscar
let textFound = ''
let fragRes = null
let slide = 0

// Sobre las canciones
let newSongsSize = 0
let _listTotal = null // Listado html de las canciones desplegadas en el front
let iterator = {} // Resultado del iterador sobre las canciones
let newSongs = [] // Posibles nuevas canciones agregadas
let _songs = null // Canciones cargadas
let count = 0
let _list = null // Listado html de las canciones desplegadas en el front

// Para generar la animación del botón play
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
// Archivos de configuraciones
let configFile = jread(CONFIG_FILE) // Configuraciones básicas
let lang = jread(LANG_FILE)[configFile.lang] // Textos en idiomas
let alerts = lang.alerts // Mensajes de alertas

// DOM a usar
const dom_pop_up_container = $('#pop-up-container')
const dom_search_container = $('#search-container')
const dom_wrapper_results = $('#wrapper-results')
const dom_search_wrapper = $('#search-wrapper')
const dom_grid_container = $('.grid-container')
const dom_btn_controlls = $('.btn-controlls')
const dom_search_result = $('#search-result')
const dom_shuffle_icon = $('#shuffle-icon')
const dom_list_songs = $('#list-songs')
const dom_anim_play = $('.anim-play')
const dom_pop_up = $('#pop-up')
const dom_config = $('#config')
const dom_search = $('#search')

/** -------------------------- Funciones ------------------------ **/
// Activar shuffle
if (configFile.shuffle) $(dom_shuffle_icon, { css: 'fill: #FBFCFC' })

/**
 * Una de las funciones importantes.
 * Se encarga de verificar si hay canciones que mostrar y arma lo
 * necesario para que el reproductor funciones
 */
function loadSongs() {
  _songs = jread(SONG_FILE)
  if (Object.keys(_songs).length === 0) {
    $(dom_list_songs, {
      addText: `<div id="init-message">${alerts.welcome}</div>`
    })
  } else {
    checkNewSongs() // Revisa si hay nuevas canciones en la carpeta previamente ingresada
    setSongs(_songs) // Pasamos el listado total de canciones a playFile.js
    setNextSongFunction(nextSong) // Compartimos la función nextSong para el evento onclick en el listado de canciones
    createDefaultListView() // Desplegamos el listado de canciones con el estilo por defecto de tipo lista
  }
}

/**
 * Función iteradora que retorna la ruta de la canción
 *
 * @return objeto iterador {object} - {value: 'nombre de la canción', done: true | false}
 */
function* readSongs() {
  while (newSongsSize--) yield newSongs[newSongsSize]
}

/**
 * Usamos MUSICMETADATA de @leetreveil npm
 *
 * @var iter {Objet} - Objeto iterador de la función generadora readSongs
 */
function getMetadata(iter) {
  $(dom_pop_up, {
    addText: `${alerts.newSongsFound}${count++} / ${newSongs.length}`
  })

  // Retorn {value: 'nombre de la canción', done: true | false}
  iterator = iter.next()
  if (!iterator.done && iterator.value !== undefined) {
    // Extraer metadatas de los archivos de audio
    metaData(fs.createReadStream(iterator.value), function metaDataExtract(error, data) {
      // Agregar las nuevas canciones al objeto _songs
      // En caso de error, generar atributos de la canción con un valor en el idioma correspondiente
      _songs.push(
        error ? {
          artist: lang.artist.replace(/\s+/ig, '&nbsp;'),
          album: lang.album.replace(/\s+/ig, '&nbsp;'),
          title: lang.title.replace(/\s+/ig, '&nbsp;'),
          filename: iterator.value
        } : {
            artist: (data.artist.length !== 0 ? data.artist[0] : lang.artist).replace(/\s+/ig, '&nbsp;'),
            album: (data.album.trim().length !== 0 ? data.album : lang.album).replace(/\s+/ig, '&nbsp;'),
            title: (data.title.trim().length !== 0 ? data.title : lang.title).replace(/\s+/ig, '&nbsp;'),
            filename: iterator.value
          }
      )
      getMetadata(iter)
    })
  } else {
    _songs = jsave(SONG_FILE, _songs)
    // Ocultar pop-up
    $(dom_pop_up_container, { addClass: 'hide' })
    return
  }
}

/**
 * Chequear si hay nuevas canciones en el direcctorio para que sean agregadas
 */
function checkNewSongs() {
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
        $(dom_pop_up_container, { rmClass: 'hide' })
        $(dom_pop_up, { addClass: 'pop-up-anim' })
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
    $(dom_list_songs, { addText: '' })
    loadSongs()
  }
})

// Generar el listado de canciones cuando se han cargado desde el panel de configuraciones
// El llamdo se hace desde el main.js
ipcRenderer.on('order-display-list', () => {
  $(dom_list_songs, { addText: '' })
  loadSongs()
})

// Abrir ventana de configuración
$(dom_config, {
  on: {
    'click': () => {
      ipcRenderer.send('show-config')
    }
  }
})

// Acciones sobre los botones del menú superior.
// play, prev, next & shuffles
function clickBtnControls() {
  $(this, { addClass: 'click-controlls' })

  if (_songs.length !== 0) {
    switch (this.id) {
      case 'play-pause':
        playSong() === 'resume' ? dom_anim_play.forEach((v, i) => {
          $(v, { attr: ['from', anim.from[i], 'to', anim.to[i]] }).beginElement()
        }) : dom_anim_play.forEach((v, i) => {
          $(v, { attr: ['from', anim.to[i], 'to', anim.from[i]] }).beginElement()
        })
        break
      case 'next': nextSong(); break
      case 'shuffle':
        configFile.shuffle = !configFile.shuffle
        $(dom_shuffle_icon, {
          css: (configFile.shuffle ? 'fill:#FBFCFC' : 'fill:#f06292')
        })
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
function endAnimBtnControlls() {
  $(this, { rmClass: 'click-controlls' })
}

dom_btn_controlls.forEach(v => {
  $(v, {
    on: {
      'click': clickBtnControls,
      'animationend': endAnimBtnControlls
    }
  })
})

// Configurar el equalizador.
ipcRenderer.on('get-equalizer-filter', (e, a) => {
  setFilterVal(...a)
})

function hideSearchInputData() {
  $(dom_search_result, { addText: '' })
  $(dom_search_container, { addClass: 'hide' })
  $(dom_search_wrapper, { rmClass: 'search-wrapper-anim' })
  $(dom_grid_container, { rmAttr: 'style' })
  $(dom_search, { rmClass: 'input-search-anim' })
  isSearchDisplayed = false
}

// Desplegar input search para buscar canciones, artistas, o album
// Registrar un shorcut
function searchInputData(e) {
  searchValue = this.value

  if (e.key === 'ArrowRight' && searchValue.length > 1)
    this.value = $(dom_search_result).textContent

  if (e.key === 'Enter') {
    // Reproduce la canción buscada
    nextSong($(_list[0], { getData: ['position', 'int'] }))
    // Anima el botón play
    dom_anim_play.forEach((v, i) => {
      $(v, { attr: ['from', anim.from[i], 'to', anim.to[i]] }).beginElement()
    })
    hideSearchInputData()
  }

  searchRgx = new RegExp(`^${searchValue.replace(/\s/g, '&nbsp;')}`, 'img')
  _list = _listTotal.filter(v => searchRgx.test($(v, { getData: ['title', 'string'] })))

  // Posibles resultados
  if (searchValue.length > 0) {
    const total = _list.length
    slide = total > 20 ? Math.floor(total / 20) : 1
    var tempSlide = slide
    countSearch = 0
    fragContRes = document.createDocumentFragment()
    fragRes = document.createDocumentFragment()

    // Genera slide con listado total de las coincidencias
    while (slide--) {
      for (var i = 0; i < (total < 20 ? total : 20); i++) {
        textFound = $(_list[countSearch], { getData: ['title', 'string'] }).replace(/\&nbsp;/g, ' ')
        // Se generan los items dentro del slide
        fragRes.appendChild(
          $(searchResultsElements[1], {
            clone: 'div',
            addClass: 'grid-25 mobile-grid-25',
            addTo: [
              $(searchResultsElements[2], {
                clone: 'div',
                addClass: 'search-results',
                addText: textFound.length > 25 ? `${textFound.slice(0, 25)}...` : textFound
              })
            ],
            setData: {
              position: $(_list[countSearch], { getData: ['position', 'int'] })
            },
            on: {
              'click': function onClickResults() {
                // Reproduce la canción buscada
                nextSong($(this, { getData: ['position', 'int'] }))
                // Anima el botón play
                dom_anim_play.forEach((v, i) => {
                  $(v, { attr: ['from', anim.from[i], 'to', anim.to[i]] }).beginElement()
                })
                hideSearchInputData()
              }
            }
          })
        )
        countSearch++
      }
      // Agregar los items al slide
      fragContRes.appendChild(
        $(searchResultsElements[0], {
          clone: 'div',
          addClass: 'results',
          addTo: [fragRes],
          css: `width:${document.body.clientWidth}px;`
        })
      )
    }

    // Despliega el total de canciones
    $(dom_wrapper_results, {
      addText: '',
      addTo: [fragContRes],
      css: `width:${tempSlide * document.body.clientWidth}px;`
    })
  } else {
    // Limpiar cuando no haya coincidencia
    $(dom_wrapper_results, { addText: '' })
  }

  // Mustra la primera coincidencia como opción a buscar
  $(dom_search_result, {
    addText: _list.length > 0 && searchValue.length > 0 ? $(_list[0], { getData: ['title', 'string'] }) : ''
  })
}

// Se detecta el registro de la combinación de teclas (ctrl|cmd) + F
// Para desplegar la busqueda de canciones
ipcRenderer.on('search-song', () => {
  if (!isSearchDisplayed) {
    _listTotal = $(dom_list_songs, { getChild: 'all' })
    $(dom_search_container, { rmClass: 'hide' })
    $(dom_search_wrapper, { addClass: 'search-wrapper-anim' })
    $(dom_grid_container, { css: '-webkit-filter: blur(2px)' })
    $(dom_search, {
      addClass: 'search-anim',
      on: {
        'keyup': searchInputData
      }
    }).focus()

    isSearchDisplayed = true
  }
})

// Se detecta el cierre del inputsearch con la tecla Esc
ipcRenderer.on('close-search-song', () => {
  if (isSearchDisplayed) hideSearchInputData()
})

// Adelantar o retroceder la canción usando la barra de progreso
$('#total-progress-bar', {
  on: {
    'click': function onClickProgressBar(e) {
      moveForward(e, this)
      // e.offsetX -> donde se hizo click
      // this.clientWidth -> hancho
      // _duration
      // move
    }
  }
})
