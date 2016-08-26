const {
  ipcRenderer,
  metaData,
  execFile,
  dialog,
  fs
} = require('./commons')

// Varibles
let metaDataSongs = [] // Contendrá los metadatas de las canciones
let configFile = jread(CONFIG_FILE)
let iterator = {} // Resultado del iterador sobre las canciones
let count = 0 // Contador de archivos parseados para obtener los metadata
let songs = []  // Array con las rutas de los archivos de audio
let lang = jread(LANG_FILE)[configFile.lang]
let alerts = lang.alerts
let songsSize = 0

/**
 * Texto a modificar en la ventana de configuraciones
 */
function updateTextContet () {
  $('#_addsongfolder', {addText: lang.config.addSongFolder})
  $('#_statussongfolder', {addText: lang.config.statusSongFolder})
  $('#_changelanguage', {addText: lang.config.changeLanguage})
  $('#_statuslanguage', {addText: lang.config.statusLanguage})
  $('#_titleconfig', {addText: lang.config.titleConfig})
//   $('#_addaccounts', {addText: c.addAccounts})
//   $('#_equalizersetting', {addText: c.equalizerSetting})
}
updateTextContet()

// Refrescar la ventana
$('#_titleconfig', {
  click: () => {
    window.location.reload(false)
  }
})

/**
 * Animación del panel cuando se selecciona una opción para configurar
 */
function animConfigPanel () {
  $('#config-container-options', {
    addClass: 'config-opt-anim',
    animEnd: function animPanelEnd () {
      $('#config-container-values', {rmClass: 'hide'})
      $(this, {addClass: 'hide'})
    }
  })
}

/**
 * Cambiar el idioma del reproductor
 */
function onClickChangeLang () {
  $(`#${$(this, {getData: ['action', 'string']})}`, {rmClass: 'hide'})

  animConfigPanel()
  // configuraciones > ventana de configuración actual
  $('#_titlesubconfig', {addText: `> ${lang.config.changeLanguage}`})

  $('.lang-option').forEach(v => {
    $(v, {
      click: function onClickLangOption () {
        configFile.lang = $(this, {getData: ['lang', 'string']})
        configFile = jsave(CONFIG_FILE, configFile)
      }
    })
  })
}

// Cambiar idioma
$('#change-lang', {click: onClickChangeLang})

/**
 * Función iteradora que retorna la ruta de la canción
 *
 * @return objeto iteratodr {object} -  {value: 'nombre de la canción', done: true | false}
 */
function * readSongs () {
  while (songsSize--) yield songs[songsSize]
}

/**
 * Usamos MUSICMETADATA de @leetreveil npm
 *
 * @var iter {Objet} - Objeto iterador de la función generadora readSongs
 */
function getMetadata (iter) {
  // Pop-up con la cantidad de canciones cargandose
  $('#_loading-info', {
    addText: `${lang.config.loadingSongFolder} ${count++} / ${songs.length}`
  })

  // Retorn {value: 'nombre de la canción', done: true | false}
  iterator = iter.next()
  if (!iterator.done && iterator.value !== undefined) {
    // Extraer metadatas de los archivos de audio
    metaData(fs.createReadStream(iterator.value), function metaDataExtract (error, data) {
      // En caso de error, generar atributos de la canción con un valor en el idioma correspondiente
      if (error) {
        metaDataSongs.push({
          artist: lang.artist.replace(/\s+/ig, '&nbsp;'),
          album: lang.album.replace(/\s+/ig, '&nbsp;'),
          title: lang.title.replace(/\s+/ig, '&nbsp;'),
          filename: iterator.value
        })
      } else {
        metaDataSongs.push({
          artist: (data.artist[0] !== undefined || data.artist.length !== 0 ? data.artist[0] : lang.artist).replace(/\s+/ig, '&nbsp;'),
          album: (data.album !== undefined || data.album !== '' ? data.album : lang.album).replace(/\s+/ig, '&nbsp;'),
          title: (data.title !== undefined || data.title !== '' ? data.title : lang.title).replace(/\s+/ig, '&nbsp;'),
          filename: iterator.value
        })
      }
      getMetadata(iter)
    })
  } else {
    jsave(SONG_FILE, metaDataSongs)
    ipcRenderer.send('display-list')

    // Ocultar loading
    $('#loading', {addClass: 'hide'})
    $('.grid-container', {rmAttr: 'style'})
    return
  }
}

/**
 * Obtenemos las canciones
 *
 * @var parentFolder {String} - Ruta donde se buscarán las canciones
 */
function saveSongList (parentFolder = '') {
  // Sobre escribir el archivo listSong.json
  jsave(SONG_FILE, '[]')

  // Actualizar status de la carpeta
  $('#folder-status', {getChild: 0, addText: parentFolder})
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
      $('#loading', {rmClass: 'hide'})
      $('.grid-container', {css: '-webkit-filter: blur(2px)'})

      // Leer metadata
      getMetadata(readSongs())
    }
  })
}

// Acción para agregar el listado de canciones
$('#add-songs', {
  click: () => {
    dialog.showOpenDialog({
      title: 'Add music folder',
      properties: ['openDirectory']
    }, parentFolder => {
      if (parentFolder !== undefined) saveSongList(parentFolder[0]) // home/usuario/Música  - Ejemplo de la ruta de la carpeta padre
    })
  }
})

// Panel equalizador
// function onEqualizerPanel (e) {
//   $(`#${$(this, {getData: ['action', 'string']})}`, {removeClass: 'hide'})

//   animConfigPanel()
//   $('#_titlesubconfig', {addText: `> ${langFile[configFile.config.lang].config.equalizerSetting}`})


//   let offset = 0
//   let _drag = 0
//   let count = 0
//   let pos
//   let _hrzGain = configFile.config.equalizer

//   function onDragMove (e) {
//     offset = parseInt(window.getComputedStyle(this).getPropertyValue('top'), 10)
//     _drag = $(this)

//     if (e.offsetY < 0) {
//       if (count < 120) {
//         $(_drag, {css: `top: ${--offset}px`})
//         ++count
//       }
//     } else if (e.offsetY > 0) {
//       if (count > -120) {
//         $(_drag, {css: `top: ${++offset}px`})
//         --count
//       }
//     }

//     ipcRenderer.send('equalizer-filter', [$(this, {getData: ['position', 'int']}), count / 10])
//   }

//   function onDragStart () {
//     pos = $(this, {getData: ['position', 'int']})
//     _hrzGain = configFile.config.equalizer
//     count = _hrzGain[pos]
//   }

//   function onDragEnd () {
//     _hrzGain[pos] = count
//     configFile.config.equalizer = _hrzGain
//     configFile = jsave(__CONFIG_FILE, configFile)
//   }

//   $('.range-circle').forEach((v, i) => {
//     $(v, {
//       css: `top:${120 - _hrzGain[i]}px`,
//       drag: onDragMove,
//       dragstart: onDragStart,
//       dragend: onDragEnd
//     })
//   })
// }
// $('#equalizer-panel', {click: onEqualizerPanel})

/**
 * Cargar Google API
 */
// function getAuth2 () {
//   let url = 'https://accounts.google.com/o/oauth2/v2/auth?'
//   let params = {
//     response_type: 'code',
//     client_id: '864249708998-sufqf8t3m5f1mmkimu6tl8pp5r0ns5bq.apps.googleusercontent.com',
//     redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
//     scope: 'https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/plus.stream.write https://www.googleapis.com/auth/plus.login',
//     access_type: 'offline'
//   }
//   Object.keys(params).forEach(v => {
//     url += `${v}=${params[v]}&`
//   }, url)
//   window.open(encodeURI(url.slice(0, url.length - 1)), 'width=400,height=780,resizable=yes')
// }
// function getToken (authCode = '', callback) {
//   let url = 'https://accounts.google.com/o/oauth2/token'
//   let params = {
//     code: authCode,
//     client_id: '864249708998-sufqf8t3m5f1mmkimu6tl8pp5r0ns5bq.apps.googleusercontent.com',
//     client_secret: 'Oysb7G118CNZdNSIolILYK1u',
//     redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
//     grant_type: 'authorization_code'
//   }
//   let uri = ''
//   Object.keys(params).forEach(v => {
//     uri += `${v}=${encodeURIComponent(params[v])}&`
//   })
//   uri = uri.slice(0, uri.length - 1)
//   let xhr = new XMLHttpRequest()
//   xhr.open('POST', url, !0)
//   xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
//   xhr.responseType = 'json'
//   xhr.onload = () => {
//     callback(xhr.response)
//   }
//   xhr.send(uri)
// }
// function onAPILoaded (token = {}) {
//   let url = 'https://www.googleapis.com/oauth2/v2/userinfo'
//   let xhr = new XMLHttpRequest()
//   xhr.open('GET', url, !0)
//   xhr.setRequestHeader('Authorization', `Bearer ${token.access_token}`)
//   xhr.responseType = 'json'
//   xhr.onload = () => {
//     console.log(xhr.response)
//   }
//   xhr.send(null)
// }
// /**
//  * Agregar cuentas de redes sociales y cuentas de música
//  */
// document.getElementById('add-accounts').onclick = function (e) {
//   e.stopImmediatePropagation()
//   document.getElementById(this.dataset.action).className = 'grid-100'
//   animConfigPanel()
// }
// /**
//  * Desplegar pasos a seguir para guardar cuentas
//  */
// Array.from(document.getElementsByClassName('save-accounts-action')).forEach(v => {
//   v.onclick = function (e) {
//     e.stopImmediatePropagation()
//     document.getElementById(this.dataset.action).className = 'steps'
//   }
// })
// /**
//  * Google plus account
//  */
// document.getElementById('g-action-btn').onclick = e => {
//   e.stopImmediatePropagation()
//   getAuth2()
// }
// document.getElementById('g-guardar').onclick = e => {
//   e.stopImmediatePropagation()
//   getToken(document.getElementById('g-code').value.toString(), res => {
//     onAPILoaded(res)
//   })
// }
