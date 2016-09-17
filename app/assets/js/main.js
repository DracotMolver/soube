/**
 * @author Diego Alberto Molina Vera
 */
/**********************************************************************************************/
/** --------------------------------------- Módulos --------------------------------------- **/
// Funciones para reproducir las canciones
const {
  setFilterVal,
  moveForward,
  playSong,
  prevSong,
  nextSong,
  setSongs
} = require('./playFile')

// funciones para crear el listado de canciones
const {
  createDefaultListView,
  setNextSongFunction,
  getMetadata
} = require('./listSongs')

// Generales
const {
  ipcRenderer,
  metaData,
  execFile,
  dialog,
  fs
} = require('./commons')


/***********************************************************************************************/
/** --------------------------------------- Variables --------------------------------------- **/
let _songs = [] // Canciones cargadas

// Busqueda de canciones
let isSearchDisplayed = false // Validar si se ha pulsado (ctrl | cmd) + f
let totalResults = 0
let searchValue = ''
let fragContRes = null
let searchRgx = null // Nombre de la canción a buscar
let textFound = ''
let tempSlide = 0
let fragRes = null
let items = [
  $.clone('div', false).addClass('grid-25 mobile-grid-25'),
  $.clone('div', false).addClass('search-results'),
  $.clone('div', false).addClass('results')
]
let slide = 0
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


/***********************************************************************************************/
/** --------------------------------------- Funciones --------------------------------------- **/
/**
 * Una de las funciones importantes.
 * Se encarga de verificar si hay canciones que mostrar y arma lo
 * necesario para que el reproductor funciones
 */
function loadSongs() {
  if (Object.keys(jread(SONG_FILE)).length === 0) {
    $('#list-songs').text(`<div id="init-message">${lang.alerts.welcome}</div>`)
  } else {
    checkNewSongs()
    setNextSongFunction(nextSong) // Compartimos la función nextSong para el evento onclick en el listado de canciones
    createDefaultListView() // Desplegamos el listado de canciones con el estilo por defecto de tipo lista
  }
}

function hideSearchInputData() {
  $('#search-result').text('')
  $('#search-container').addClass('hide')
  $('#search-wrapper').rmClass('search-wrapper-anim')
  $($('.grid-container').element[0]).rmAttr('style')
  $('#search').rmClass('input-search-anim')
  isSearchDisplayed = false
}

// Desplegar input search para buscar canciones
// Registrar un shorcut
function searchInputData(e) {
  searchValue = this.value
  if (e.key === 'ArrowRight' && searchValue.length > 1)
    this.value = $('#search-result').text()

  if (e.key === 'Enter') {
    // Reproduce la canción buscada
    // Por defecto es la primera posible coincidencia - texto fantasma
    nextSong(_list[0].position)
    // Anima el botón play
    $('.anim-play').element.forEach((v, i) => {
      $(v).attr({ 'from': anim.from[i], 'to': anim.to[i] }).element.beginElement()
    })
    hideSearchInputData()
  }

  searchRgx = new RegExp(`^${searchValue.replace(/\s+/g, '&nbsp;')}`, 'ig')
  _list = _songs.filter(v => searchRgx.test(v.title))

  // Posibles resultados
  if (searchValue.length > 0) {
    totalResults = _list.length
    tempSlide = slide = totalResults > 20 ? Math.floor(totalResults / 20) : 1
    fragContRes = document.createDocumentFragment()
    fragRes = document.createDocumentFragment()

    // Genera slide con listado total de las coincidencias
    const x = (totalResults < 20 ? totalResults : 20)
    while (slide--) {
      for (var i = 0; i < x; i++ , totalResults--) {
        textFound = _list[totalResults - 1].title.replace(/\&nbsp;/g, ' ')
        // Se generan los items dentro del slide
        fragRes.appendChild(
          $.clone(items[0], true)
            .insert(
            $.clone(items[1], true)
              .text(textFound.length > 25 ? `${textFound.slice(0, 25)}...` : textFound)
            )
            .data({
              position: _list[totalResults - 1].position
            })
            .on({
              'click': function () {
                // Reproduce la canción buscada
                nextSong($(this).data('position', 'int'))
                // Anima el botón play
                $('.anim-play').element.forEach((v, i) => {
                  $(v).attr({ 'from': anim.from[i], 'to': anim.to[i] }).element.beginElement()
                })
                hideSearchInputData()
              }
            }).element
        )
      }

      // Agregar los items al slide
      fragContRes.appendChild(
        $.clone(items[2], true)
          .insert(fragRes)
          .css(`width:${document.body.clientWidth}px;`).element
      )
    }

    // Agregar paginación en caso de haber más de un slide
    if (tempSlide > 1) {
      // Como hay más canciones de las que se muestran
      // se crea la paginación y siempre empieza en el primer slide
      // generando así la animación de la flecha del lado derecho para avanzar al siguiente slide
      $($('#pagination').rmClass('hide')
        .child(1)).addClass('arrow-open-anim')
    } else {
      $('#pagination').addClass('hide')
    }

    // Despliega el total de canciones
    $('#wrapper-results').text('')
      .insert(fragContRes)
      .css(`width:${tempSlide * document.body.clientWidth}px;`)
  } else {
    // Limpiar cuando no haya coincidencia
    $('#wrapper-results').text('')
    $('#pagination').addClass('hide')
  }

  // Mustra la primera coincidencia como opción a buscar
  $('#search-result').text(_list.length > 0 && searchValue.length > 0 ? _list[0].title : '')
}

/**
 * Chequear si hay nuevas canciones en el direcctorio para que sean agregadas
 */
function checkNewSongs() {
  getMetadata(lang.config.statusSongFolder, () => {
    // Desplegar pop-up
    $('#pop-up-container').rmClass('hide')
    $('#pop-up').addClass('pop-up-anim')
  }, (_s) => {
    setSongs((_songs = _s)) // Pasamos el listado total de canciones a playFile.js
    // Ocultar pop-up
    $('#pop-up-container').addClass('hide')
    $('#pop-up').rmClass('pop-up-anim')
  }, (count, maxLengt) => {
    // Pop-up con la cantidad de canciones cargandose
    $('#pop-up').text(`${lang.alerts.newSongsFound}${count} / ${maxLengt}`)
  })
}

// Acciones sobre los botones del menú superior.
// play, prev, next & shuffles
function clickBtnControls() {
  $(this).addClass('click-controlls')

  if (_songs.length !== 0) {
    switch (this.id) {
      case 'play-pause':
        playSong() === 'resume' ?
          $('.anim-play').element.forEach((v, i) => {
            $(v).attr(
              { 'from': anim.from[i], 'to': anim.to[i] }
            ).element.beginElement()
          }) :
          $('.anim-play').element.forEach((v, i) => {
            $(v).attr(
              { 'from': anim.to[i], 'to': anim.from[i] }
            ).element.beginElement()
          })
        break
      case 'next': nextSong(); break
      case 'prev': prevSong(); break
      case 'shuffle':
        configFile.shuffle = !configFile.shuffle
        $('#shuffle-icon').css(configFile.shuffle ? 'fill:#FBFCFC' : 'fill:#f06292')
        configFile = jsave(CONFIG_FILE, configFile)
        break
    }
  } else {
    dialog.showMessageBox({
      type: 'info',
      buttons: ['Ok'],
      message: lang.alerts.error_002
    })
  }
}


/***********************************************************************************************/
/** --------------------------------------- Eventos --------------------------------------- **/
// Activar shuffle
if (configFile.shuffle) $('#shuffle-icon').css('fill: #FBFCFC')

// Abrir ventana de configuración
$('#config').on({
  'click': () => { ipcRenderer.send('show-config') }
})

// Vendría siendo el método init
fs.access(SONG_FILE, fs.F_OK | fs.R_OK, error => {
  if (error) {
    dialog.showErrorBox('Error [001]', `${lang.alerts.error_001}`)
    return
  } else {
    // Iniciar todo lo necesario para desplegar en la interfaz
    $('#list-songs').text('')
    loadSongs()
  }
})

$('.btn-controlls').element.forEach(v => {
  $(v).on({
    'click': clickBtnControls,
    'animationend': function () {
      $(this).rmClass('click-controlls')
    }
  })
})

// Adelantar o retroceder la canción usando la barra de progreso
$('#total-progress-bar').on({
  'click': function (e) { moveForward(e, this) }
})

// Acción sobre los botones de paginación
$('.arrow').element.forEach(v => {
  $(v).on({
    'click': function () {
      if (/arrow-open-anim/g.test(this.className)) {
        if (this.id === 'right-arrow') { // Paginación a la izquierda

        } else { // Paginación a la derecha

        }
      }
    }
  })
})


/**************************************************************************************************/
/** --------------------------------------- Ipc Renderer --------------------------------------- **/
// Se detecta el cierre del inputsearch con la tecla Esc
ipcRenderer.on('close-search-song', () => {
  if (isSearchDisplayed) hideSearchInputData()
})

// Se detecta el registro de la combinación de teclas (ctrl|cmd) + F
// Para desplegar la busqueda de canciones
ipcRenderer.on('search-song', () => {
  if (!isSearchDisplayed) {
    $('#search-container').rmClass('hide')
    $('#search-wrapper').addClass('search-wrapper-anim')
    $($('.grid-container').element[0]).css('-webkit-filter: blur(2px)')
    $('#search').addClass('search-anim')
      .on({ 'keyup': searchInputData })
      .val()
      .focus()

    isSearchDisplayed = true
  }
})

// Configurar el equalizador.
ipcRenderer.on('get-equalizer-filter', (e, a) => {
  setFilterVal(...a)
})

// Generar el listado de canciones cuando se han cargado desde el panel de configuraciones
// El llamdo se hace desde el main.js
ipcRenderer.on('order-display-list', () => {
  $('#list-songs').text('')
  loadSongs()
})

// Pausar o empezar canción con la combinación Ctrl + Up
ipcRenderer.on('play-and-pause-song', () => {
  playSong() === 'resume' ?
    $('.anim-play').element.forEach((v, i) => {
      $(v).attr(
        { 'from': anim.from[i], 'to': anim.to[i] }
      ).element.beginElement()
    }) :
    $('.anim-play').element.forEach((v, i) => {
      $(v).attr(
        { 'from': anim.to[i], 'to': anim.from[i] }
      ).element.beginElement()
    })
})

// Siguiente canción con la combinación Ctrl + Right
ipcRenderer.on('next-song', () => {
  nextSong()
})

// Canción anterior con la combinación Ctrl + Left
ipcRenderer.on('prev-song', () => {
  prevSong()
})