/**
 * @author Diego Alberto Molina Vera
 */
/** -------------------------- Módulos ------------------------ **/
// Generales
const {
  ipcRenderer,
  metaData,
  execFile,
  dialog,
  fs
} = require('./commons')

const {
  getMetadata
} = require('./listSongs')

/** -------------------------- Variables ------------------------ **/
let metaDataSongs = [] // Contendrá los metadatas de las canciones
let songsSize = 0
let configFile = jread(CONFIG_FILE)
let iterator = {} // Resultado del iterador sobre las canciones
let songs = []  // Array con las rutas de los archivos de audio
let lang = jread(LANG_FILE)[configFile.lang]
let alerts = lang.alerts
let count = 0 // Contador de archivos parseados para obtener los metadata

// Equalizador
let y = 0
let pos = 0
let hrzGain = configFile.equalizer
let range = null
let plus = 0
let db = 0;

/** -------------------------- Funciones ------------------------ **/
/**
 * Texto a modificar en la ventana de configuraciones
 */
(function updateTextContet() {
  $('#_addsongfolder').text(lang.config.addSongFolder)
  $('#_statussongfolder').text(lang.config.statusSongFolder)
  $('#_changelanguage').text(lang.config.changeLanguage)
  $('#_statuslanguage').text(lang.config.statusLanguage)
  $('#_titleconfig').text(lang.config.titleConfig)
  $('#_equalizersetting').text(lang.config.equalizerSetting)
  $('#_infoequalizer').text(alerts.infoEqualizer)
})()

// Refrescar la ventana
$('#_titleconfig').on({
  'click': () => { window.location.reload(false) }
})

/**
 * Animación del panel cuando se selecciona una opción para configurar
 */
function animConfigPanel() {
  $('#config-container-options')
    .addClass('config-opt-anim')
    .on({
      'animationend': function () {
        $('#config-container-values').rmClass('hide')
        $(this).addClass('hide')
      }
    })
}

/**
 * Cambiar el idioma del reproductor
 */
function onClickChangeLang() {
  $(`#${$(this).data('action', 'string')}`).rmClass('hide')

  animConfigPanel()
  // configuraciones > ventana de configuración actual
  $('#_titlesubconfig').text(` > ${lang.config.changeLanguage}`)

  $('.lang-option').element.forEach(v => {
    $(v).on({
      'click': function () {
        configFile.lang = $(this).data('lang', 'string')
        configFile = jsave(CONFIG_FILE, configFile)
        window.location.reload(false)
      }
    })
  })
}

// Cambiar idioma
$('#change-lang').on({
  'click': onClickChangeLang
})


/**
 * Obtenemos las canciones
 *
 * @var parentFolder {String} - Ruta donde se buscarán las canciones
 */
function saveSongList(parentFolder = '') {
  // Sobre escribir el archivo listSong.json
  jsave(SONG_FILE, {})

  // Actualizar status de la carpeta
  $($('#folder-status').child(0)).text(parentFolder)
  const langFile = jread(LANG_FILE)
  langFile['es'].config.statusSongFolder = parentFolder
  langFile['us'].config.statusSongFolder = parentFolder
  lang = jsave(LANG_FILE, langFile)[configFile.lang]

  // Leer el contenido de la carpeta padre
  // Desplegar loading
  getMetadata(parentFolder, () => { // Función inicial del proceso
    $('#loading').rmClass('hide')
    $($('.grid-container').element[0]).css('-webkit-filter: blur(2px)')
  },(_s) => { // Función final del proceso
    ipcRenderer.send('display-list')
    // Ocultar loading
    $('#loading').addClass('hide')
    $($('.grid-container').element[0]).rmAttr('style')
  }, (count, maxLengt) => { // Función iteradora
    // Pop-up con la cantidad de canciones cargandose
    $('#_loading-info').text(`${lang.config.loadingSongFolder} ${count++} / ${maxLengt}`)
  })
}

// Acción para agregar el listado de canciones
$('#add-songs').on({
  'click': () => {
    dialog.showOpenDialog({
      title: 'Add music folder',
      properties: ['openDirectory']
    }, parentFolder => {
      if (parentFolder !== undefined) saveSongList(parentFolder[0]) // home/usuario/Música  - Ejemplo de la ruta de la carpeta padre
    })
  }
})

// Animación de los botones sobre el panel ecualizador
function onEqualizerPanel(e) {
  $(`#${$(this).data('action', 'string')}`).rmClass('hide')

  animConfigPanel()
  $('#_titlesubconfig').text(` > ${lang.config.equalizerSetting}`)

  y = 0
  pos = 0
  range = null
  plus = 0
  db = 0

  const onDragMove = e => {
    if (range !== null) {
      y = parseInt(window.getComputedStyle(range).getPropertyValue('top'), 10)
      plus = (e.clientY - range.offsetTop) + y
      if (plus > 0 && plus < 261) {
        db = plus
        $(range).css(`top: ${(e.clientY - range.offsetTop) + y}px;`)
      }
      ipcRenderer.send('equalizer-filter', [
        $(range).data('position', 'int'),
        parseFloat(db / 20 > 130 ? -(7 - db / 20) : (7 - db / 20) + 1.8).toFixed(3)
      ])
    }
  }

  const onDragStart = function onDragStart(e) {
    range = this
    pos = $(range).data('position', 'int')
  }

  const onDragEnd = () => {
    hrzGain[pos] = db
    configFile.equalizer = hrzGain
    configFile = jsave(CONFIG_FILE, configFile)
    range = null
  }

  // Necesario para tener un drag más suave
  $(document).on({
    'mouseup': onDragEnd,
    'mousemove': onDragMove
  })

  // El evento es solo registrado sobre los botones redondos
  $('.range-circle').element.forEach((v, i) => {
    $(v).on({
      'mousedown': onDragStart
    })
      .css(`top:${hrzGain[i] === 0 ? 130 : hrzGain[i]}px;`) // Setear la configuración establecida
  })
}

// Mostrar ecualizador
$('#equalizer-panel').on({
  'click': onEqualizerPanel
})
