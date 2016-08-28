/**
 * -------------------------- Módulo PlayFile -------------------------- *
 *
 * Encargada de reproducir la canción, tocar la siguiente canción o la anterior.
 * Acá se usa la Audio Web API para reproducir la canción y también usar datos
 * obtenidos mediante el buffer. también la API nos permite manipular el archivo de audio
 */
const {dialog} = require('./commons')

/** ---------------------------- Varibles ---------------------------- **/
let isSongPlaying = false // Se ejecutó play sobre el AudioNode
let isNexAble = false // Se puede reproducir la siguiente canción
let position = 0 // Posición de la canción actual
let filePath = '' // Ruta de la canción
let songs = {} // Listado de canciones

// Variables necesarios para el AudioContext
const audioContext = new window.AudioContext() // Contendrá el objeto AudioContext
let _duration = 0 // Duración máxima de la canción
const gain = audioContext.createGain() // Gain a usar sobre el AudioNode
  gain.gain.value = 1.05
let source = null // Contendrá el objeto AudioNode
let xhtr = new XMLHttpRequest() // Contendrá el objeto XMLHttpRequest

// Variables para generar el calculo del tiempo transcurrido
let millisecond = 1
let _minute = 0 // Final
let _second = 0 // Final
let interval = null // Función interval para crear el tiempo de reproducción
let percent = 0
let minute = 0 // Inicial
let second = 0 // Iinicial
let time = 0 // Tiempo total final
let filter = [] // Almancenará un array con el filtro a usar en distintas frecuencias
let hrz = [50, 100, 156, 220, 331, 440, 622, 880, 1250, 1750, 2500, 3500, 5000, 10000, 20000]

/** ---------------------------- Funciones ---------------------------- **/
/**
 * Listado de canciones desde el archivo listSongs.js
 *
 * @var _songs {Object} - Objeto contenedor del listado total de canciones
 */
function setSongs (_songs) {
  songs = _songs
  filters()
}

/**
 * Retorna un número aleatorio entre 0 y el máximo de canciones
 *
 * @return random {Number}
 */
function shuffle () {
  return Math.floor(Math.random() * songs.length).toString()
}

/**
 * Reproducirá una cancione o la pausará de estar ya reproduciendose
 *
 * @return estado actual del reproductor {String}
 */
function playSong () {
  if (!isSongPlaying && audioContext.state === 'running') { // Primera vez
    dataSong(shuffle())
    play()
    return 'resume'
  } else if (isSongPlaying && audioContext.state === 'running') { // Ya reproduciendo
    audioContext.suspend().then(() => {
      isSongPlaying = false
      clearInterval(interval)
    })
    return 'paused'
  } else if (!isSongPlaying && audioContext.state === 'suspended') { // Pausado
    isSongPlaying = true
    startTimer()
    audioContext.resume()
    return 'resume'
  }
}

/**
 * Generará el tiempo que lleva reproduciendose la canción
 */
function startTimer () {
  const pb = $('#progress-bar')
  const lapse = 100 / _duration
  
  interval = setInterval(() => {
    ++millisecond
    if (millisecond / 100 > second + (60 * minute)) { // Segundos
      if (second > 59) {
        ++minute
        second = 0
      }
      // Tiempo transcurrido
      $('#time-start', {
        addText: `${minute > 9 ? `${minute}` : `0${minute}`}${second > 9 ? `:${second}` : `:0${second}`}`
      })
      ++second
      $(pb, {css: `width:${percent += lapse}%`}) // Barra de carga
    }
  }, 10)
}

/**
 * Limpiará el tiempo transcurrido y liberará a la función setInterval
 */
function stopTimer () {
  isSongPlaying = false
  clearInterval(interval)
  $('#time-start', {addText: '00:00'})
  millisecond = second = minute = percent =
  _duration = _minute = _second = time = 0
}

/**
 * Obtinene los datos de la variable song a partir de la posición dada
 * para desplegarlos en la interfaz
 *
 * @var _position {Number} - Posición de la canción a reproducir
 */
function dataSong (_position) {
  const infoSong = songs[(position = parseInt(_position, 10))]
  filePath = infoSong.filename // Ruta donde se encuentra el archivo a reproducir

  // Título de la canción
  $('#song-title', {getChild: 0, addText: infoSong.title})

  // Artista
  $('#artist', {getChild: 0, addText: infoSong.artist})

  // Album
  $('#album', {getChild: 0, addText: infoSong.album})
}

/**
 * EJecuta, por medio de la Audio Web API, la canción.
 * Se obtiene un array buffer con info útil para usar
 */
function play () {
  // Creamos un Buffer que contendrá la canción
  source = audioContext.createBufferSource()

  xhtr.open('GET', `file://${filePath}`, true)
  xhtr.responseType = 'arraybuffer'
  xhtr.onload = () => {
    audioContext.decodeAudioData(xhtr.response).then(buffer => {
      // El buffer nos entrega la duración de la canción.
      // La duración de la cación está en segundos, por ende hay que pasarla a minutos.
      time = ((_duration = buffer.duration) / 60).toString()
      _minute = parseInt(time.slice(0, time.lastIndexOf('.')), 10)
      _second = Math.floor(time.slice(time.lastIndexOf('.')) * 60)
      $('#time-end', {
        addText: `${_minute > 9 ? `${_minute}` : `0${_minute}`}${_second > 9 ? `:${_second}` : `:0${_second}`}`
      })

      // Conectar todos los nodos
      source.buffer = buffer
      source
      .connect(gain)
        .connect(filter[0])
        .connect(audioContext.destination)

      startTimer()
      source.start(0)
      isNexAble = isSongPlaying = true
      source.onended = () => {
        stopTimer()
        if (isNexAble) nextSong()
      }
    }, reason => {
      dialog.showErrorBox('Error [002]', `${jread(LANG_FILE)[jread(CONFIG_FILE).lang].alerts.playSong} ${reason}`)
      return
    })
  }
  xhtr.send()
}

/**
 * Reproducirá la siguiente canción
 *
 * @var _position {Number} - Posición de la canción a reproducir
 */
function nextSong (_position = -1) {
  if (_position !== -1) {
    // ver si está reproduciendose o no
    if (isSongPlaying && audioContext.state === 'running') {
      isNexAble = false
      source.stop(0)
      source = null
    }
    dataSong(_position)
    play()
  } else {
    // Ver en primera instancia si es posible reproducir la siguiente canción.
    // Esto va a depender de si se ejecutó ya una canción.
    // Si no se válida, podrían reproducirse varias pistas a la vez - No queremos esto :-(
    if (isNexAble) {
      isNexAble = false
      dataSong(jread(CONFIG_FILE).shuffle ? shuffle() : (songs.length - 1 > position ? position + 1 : 0))
      // si está sonando la canción, esta se debe detener para tocar la nueva
      if (isSongPlaying && audioContext.state === 'running') {
        source.stop(0)
        source = null
      }
      // Verificar si el contexto está pausado o no.
      // Si está pausado no se reproducirá una nueva pista
      if (!isSongPlaying && audioContext.state === 'suspended') audioContext.resume()
      play()
    }
  }
}

/**
 * Cambia los valores en la frecuencia específica
 */
function setFilterVal (a, b) {
  filter[a].gain.setValueAtTime(b, audioContext.currentTime + 1)
}

/**
 * Crea y asigna BiquadFilter de tipo peaking para las siguientes frequencias
 * [50, 100, 156, 220, 331, 440, 622, 880, 1250, 1750, 2500, 3500, 5000, 10000, 20000]
 */
function filters () {
  let hrzGain = jread(CONFIG_FILE).equalizer

  filter = hrz.map((v, i) => {
    return (f = audioContext.createBiquadFilter(),
      f.type = 'peaking',
      f.frequency.value = v,
      f.Q.value = 1,
      f.gain.value = hrzGain[i] / 20,
      f)
  })
  filter.reduce((p, c) => p.connect(c))
}

module.exports = Object.freeze({
  setSongs,
  playSong,
  nextSong,
  setFilterVal
})
