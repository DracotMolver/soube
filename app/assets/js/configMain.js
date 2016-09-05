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
let db = 0

  /** -------------------------- Funciones ------------------------ **/
  /**
   * Texto a modificar en la ventana de configuraciones
   */
  ; (function updateTextContet() {
    $('#_addsongfolder', { addText: lang.config.addSongFolder })
    $('#_statussongfolder', { addText: lang.config.statusSongFolder })
    $('#_changelanguage', { addText: lang.config.changeLanguage })
    $('#_statuslanguage', { addText: lang.config.statusLanguage })
    $('#_titleconfig', { addText: lang.config.titleConfig })
    $('#_equalizersetting', { addText: lang.config.equalizerSetting })
    $('#_infoequalizer', { addText: alerts.infoEqualizer })
  })()

// Refrescar la ventana
$('#_titleconfig', {
  on: {
    'click': () => { window.location.reload(false) }
  }
})

/**
 * Animación del panel cuando se selecciona una opción para configurar
 */
function animConfigPanel() {
  $('#config-container-options', {
    addClass: 'config-opt-anim',
    on: {
      'animationend': function animPanelEnd() {
        $('#config-container-values', { rmClass: 'hide' })
        $(this, { addClass: 'hide' })
      }
    }
  })
}

/**
 * Cambiar el idioma del reproductor
 */
function onClickChangeLang() {
  $(`#${$(this, { getData: ['action', 'string'] })}`, { rmClass: 'hide' })

  animConfigPanel()
  // configuraciones > ventana de configuración actual
  $('#_titlesubconfig', { addText: `> ${lang.config.changeLanguage}` })

  $('.lang-option').forEach(v => {
    $(v, {
      on: {
        'click': function onClickLangOption() {
          configFile.lang = $(this, { getData: ['lang', 'string'] })
          configFile = jsave(CONFIG_FILE, configFile)
        }
      }
    })
  })
}

// Cambiar idioma
$('#change-lang', {
  on: { 'click': onClickChangeLang }
})

/**
 * Función iteradora que retorna la ruta de la canción
 *
 * @return objeto iteratodr {object} -  {value: 'nombre de la canción', done: true | false}
 */
function* readSongs() {
  while (songsSize--) yield songs[songsSize]
}

/**
 * Usamos MUSICMETADATA de @leetreveil npm
 *
 * @var iter {Objet} - Objeto iterador de la función generadora readSongs
 */
function getMetadata(iter) {
  // Pop-up con la cantidad de canciones cargandose
  $('#_loading-info', {
    addText: `${lang.config.loadingSongFolder} ${count++} / ${songs.length}`
  })

  // Retorn {value: 'nombre de la canción', done: true | false}
  iterator = iter.next()
  if (!iterator.done && iterator.value !== undefined) {
    // Extraer metadatas de los archivos de audio
    metaData(fs.createReadStream(iterator.value), function metaDataExtract(error, data) {
      // En caso de error, generar atributos de la canción con un valor en el idioma correspondiente
      console.log(data.album.trim().length)
      metaDataSongs.push(
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
    jsave(SONG_FILE, metaDataSongs)
    ipcRenderer.send('display-list')

    // Ocultar loading
    $('#loading', { addClass: 'hide' })
    $('.grid-container', { rmAttr: 'style' })
    return
  }
}

/**
 * Obtenemos las canciones
 *
 * @var parentFolder {String} - Ruta donde se buscarán las canciones
 */
function saveSongList(parentFolder = '') {
  // Sobre escribir el archivo listSong.json
  jsave(SONG_FILE, '[]')

  // Actualizar status de la carpeta
  $('#folder-status', { getChild: 0, addText: parentFolder })
  const langFile = jread(LANG_FILE)
  langFile['es'].config.statusSongFolder = parentFolder
  langFile['us'].config.statusSongFolder = parentFolder
  lang = jsave(LANG_FILE, langFile)[configFile.lang]

  // Leer el contenido de la carpeta padre
  execFile('find', [parentFolder], (error, stdout, stderr) => {
    if (error) {
      dialog.showErrorBox('Error [003]', `${alerts.error_003} ${parentFolder} :: ${stderr}`)
      return
    } else {
      // Diferenciamos archivos de audio a otro tipo de archivos
      songs = stdout.split('\n').filter(f => {
        if (/(\.mp3|\.wav|\.wave|\/)/.test(f.slice(f.lastIndexOf('.'), f.length))) return f
      })
      songsSize = songs.length

      // Desplegar loading
      $('#loading', { rmClass: 'hide' })
      $('.grid-container', { css: '-webkit-filter: blur(2px)' })

      // Leer metadata
      getMetadata(readSongs())
    }
  })
}

// Acción para agregar el listado de canciones
$('#add-songs', {
  on: {
    'click': () => {
      dialog.showOpenDialog({
        title: 'Add music folder',
        properties: ['openDirectory']
      }, parentFolder => {
        if (parentFolder !== undefined) saveSongList(parentFolder[0]) // home/usuario/Música  - Ejemplo de la ruta de la carpeta padre
      })
    }
  }
})

// Animación de los botones sobre el panel ecualizador
function onEqualizerPanel(e) {
  $(`#${$(this, { getData: ['action', 'string'] })}`, { rmClass: 'hide' })

  animConfigPanel()
  $('#_titlesubconfig', { addText: `> ${lang.config.equalizerSetting}` })

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
        $(range, { css: `top: ${(e.clientY - range.offsetTop) + y}px;` })
      }
      ipcRenderer.send('equalizer-filter', [
        $(range, { getData: ['position', 'int'] }),
        parseFloat(db / 20 > 130 ? -(7 - db / 20) : (7 - db / 20) + 1.8).toFixed(3)
      ])
    }
  }

  const onDragStart = function onDragStart(e) {
    range = this
    pos = $(range, { getData: ['position', 'int'] })
  }

  const onDragEnd = () => {
    hrzGain[pos] = db
    configFile.equalizer = hrzGain
    configFile = jsave(CONFIG_FILE, configFile)
    range = null
  }

  // Necesario para tener un drag más suave
  $(document, {
    on: {
      'mouseup': onDragEnd,
      'mousemove': onDragMove
    }
  })

  // El evento es solo registrado sobre los botones redondos
  $('.range-circle').forEach((v, i) => {
    $(v, {
      on: {
        'mousedown': onDragStart
      },
      css: `top:${hrzGain[i] === 0 ? 130 : hrzGain[i]}px;` // Setear la configuración establecida
    })
  })
}

// Mostrar ecualizador
$('#equalizer-panel', {
  on: {
    'click': onEqualizerPanel
  }
})
