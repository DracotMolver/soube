/**
 * @author Diego Alberto Molina Vera
 */
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
let isMovingForward = false // Se se está tratando de adelantar la cación a un tiempo determinado
let isNexAble = false // Se puede reproducir la siguiente canción
let position = 0 // Posición de la canción actual
let filePath = '' // Ruta de la canción
let songs = {} // Listado de canciones

// Variables necesarios para trabajar sobre el AudioContext
const audioContext = new window.AudioContext() // Contendrá el objeto AudioContext
let _duration = 0 // Duración máxima de la canción
let _buffer = {}
let source = null // Contendrá el objeto AudioNode
const gain = audioContext.createGain() // Gain a usar sobre el AudioNode
gain.gain.value = 1.05
let xhtr = new XMLHttpRequest() // Contendrá el objeto XMLHttpRequest

// Variables para generar el calculo del tiempo transcurrido
let millisecond = 1
let interval = null // Función interval para crear el tiempo de reproducción
let _minute = 0 // Final
let _second = 0 // Final
let forward = 0 // tiempo estimado dónde debería de seguir correindo la canción al adelantarla
let percent = 0
let minute = 0 // Inicial
let second = 0 // Iinicial
let filter = [] // Almancenará un array con el filtro a usar en distintas frecuencias
let lapse = 0
let time = 0 // Tiempo total final
let hrz = [50, 100, 156, 220, 331, 440, 622, 880, 1250, 1750, 2500, 3500, 5000, 10000, 20000]

// DOM a usar
const dom_progress_bar = $('#progress-bar')
const dom_song_artist = $('#artist')
const dom_time_start = $('#time-start')
const dom_song_title = $('#song-title')
const dom_song_album = $('#album')
const dom_time_end = $('#time-end')

/** ---------------------------- Funciones ---------------------------- **/
/**
 * Listado de canciones desde el archivo listSongs.js
 *
 * @var _songs {Object} - Objeto contenedor del listado total de canciones
 */
function setSongs(_songs) {
  songs = _songs
  filters()
}

/**
 * Retorna un número aleatorio entre 0 y el máximo de canciones
 *
 * @return random {Number}
 */
function shuffle() {
  return Math.floor(Math.random() * songs.length).toString()
}

/**
 * Reproducirá una cancione o la pausará de estar ya reproduciendose
 *
 * @return estado actual del reproductor {String}
 */
function playSong() {
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
    ++millisecond
    startTimer()
    audioContext.resume()
    return 'resume'
  }
}

/**
 * Generará una animación sobre la información de una canción que sea demasiado larga
 */
function setAnimation() {
  const width = $(dom_song_title, { getChild: 0 }).scrollWidth
  if (width > $(dom_song_title).clientWidth) {
    let scrollStart = $(dom_song_title).animate(
      [
        { transform: 'translateX(0px)' },
        { transform: `translateX(-${width}px)` },
      ],
      {
        iterations: 1,
        duration: 3600,
        delay: 6600
      }
    )

    let scrollEnd = $(dom_song_title).animate(
      [
        { transform: `translateX(${width}px)` },
        { transform: 'translateX(0px)' },
      ],
      {
        iterations: 1,
        duration: 3600
      }
    )

    scrollStart.onfinish = () => {
      scrollEnd.play()
    }
    scrollEnd.onfinish = () => {
      scrollStart.play()
    }
  }
}

/**
 * Generará el tiempo que lleva reproduciendose la canción
 */
function startTimer() {
  interval = setInterval(() => {
    ++millisecond
    if (millisecond / 100 > second + (60 * minute)) { // Segundos
      if (second > 59) {
        ++minute
        second = 0
      }
      // Tiempo transcurrido
      $(dom_time_start, {
        addText: `${minute > 9 ? `${minute}` : `0${minute}`}${second > 9 ? `:${second}` : `:0${second}`}`
      })
      ++second
      $(dom_progress_bar, { css: `width:${percent += lapse}%` }) // Barra de carga
    }
  }, 10)
}

/**
 * Limpiará el tiempo transcurrido y liberará a la función setInterval
 */
function stopTimer() {
  if (!isMovingForward) {
    isSongPlaying = false
    clearInterval(interval)
    $(dom_time_start, { addText: '00:00' })
    millisecond = second = minute = percent =
      _duration = _minute = _second = time = 0
    if (isNexAble && !isMovingForward) nextSong()
  } else if (isMovingForward) {
    /** ----------------------------------- / / / ----------------------------------- **/
    /** La función stop tarda unos milesegundos más que ejecutar la función moveForward
     * Por lo tanto lo que continua después de detener la canción deberá ser ejecutado
     * dentro de la función onended
      */
    // Se debe crear un nuevo AudioNode, ya que al dar stop el nodo se eliminia
    source = audioContext.createBufferSource()

    // Evento que se gatilla al terminar la canción
    source.onended = stopTimer

    // Conectar todos los nodos
    source.buffer = _buffer
    source.connect(gain)
      .connect(filter[0])
      .connect(audioContext.destination)

    startTimer()
    source.start(0, forward)
    isMovingForward = false
    isSongPlaying = true
  }
}

/**
 * Obtinene los datos de la variable song a partir de la posición dada
 * para desplegarlos en la interfaz
 *
 * @var _position {Number} - Posición de la canción a reproducir
 */
function dataSong(_position) {
  const infoSong = songs[(position = parseInt(_position, 10))]
  filePath = infoSong.filename // Ruta donde se encuentra el archivo a reproducir

  // Título de la canción
  $(dom_song_title, { getChild: 0, addText: infoSong.title })

  // Artista
  $(dom_song_artist, { getChild: 0, addText: infoSong.artist })

  // Album
  $(dom_song_album, { getChild: 0, addText: infoSong.album })
}

/**
 * EJecuta, por medio de la Audio Web API, la canción.
 * Se obtiene un array buffer con info útil para usar
 */
function play() {
  // Creamos un Buffer que contendrá la canción
  source = audioContext.createBufferSource()

  xhtr.open('GET', `file://${filePath}`, true)
  xhtr.responseType = 'arraybuffer'
  xhtr.onload = () => {
    audioContext.decodeAudioData(xhtr.response).then(buffer => {
      // Para ser usado al momento de querer adelantar la canción
      _buffer = buffer
      // El buffer nos entrega la duración de la canción.
      // La duración de la cación está en segundos, por ende hay que pasarla a minutos.
      time = ((_duration = _buffer.duration) / 60).toString()
      _minute = parseInt(time.slice(0, time.lastIndexOf('.')), 10)
      _second = Math.floor(parseFloat(time.slice(time.lastIndexOf('.'))) * 60)
      lapse = 100 / _duration // Porcentaje a usar por cada segundo en la barra de progreso
      $(dom_time_end, {
        addText: `${_minute > 9 ? `${_minute}` : `0${_minute}`}${_second > 9 ? `:${_second}` : `:0${_second}`}`
      })
      setAnimation()
      // Evento que se gatilla al terminar la canción
      source.onended = stopTimer

      // Conectar todos los nodos
      source.buffer = _buffer
      source.connect(gain)
        .connect(filter[0])
        .connect(audioContext.destination)

      startTimer()
      source.start(0)
      isNexAble = isSongPlaying = true
    }, reason => {
      dialog.showErrorBox('Error [002]', `${jread(LANG_FILE)[jread(CONFIG_FILE).lang].alerts.playSong} ${reason}`)
      return
    })
  }
  xhtr.send()
}

/**
 * Reproducirá la siguiente canción.
 * Esta función se comparte cuando se genera la lista de cacniones
 * ya que al dar click sobre una cación la que se reproduce es otra "siguiente"
 *
 * @var _position {Number} - Posición de la canción a reproducir
 */
function nextSong(_position = -1) {
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
 * Reproducirá la canción anterior
 */
function prevSong(_position) {
  if (isNexAble) {
    isNexAble = false
    dataSong(jread(CONFIG_FILE).shuffle ? shuffle() : (songs.length - 1 > position ? position - 1 : 0))
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

/**
 * Cambia los valores en la frecuencia específica
 */
function setFilterVal(a, b) {
  filter[a].gain.setValueAtTime(b, audioContext.currentTime)
}

/**
 * Crea y asigna BiquadFilter de tipo peaking para las siguientes frequencias
 * [50, 100, 156, 220, 331, 440, 622, 880, 1250, 1750, 2500, 3500, 5000, 10000, 20000]
 */
function filters() {
  const hrzGain = jread(CONFIG_FILE).equalizer
  let f = null
  filter = hrz.map((v, i) =>
    (f = audioContext.createBiquadFilter(),
      f.type = 'peaking',
      f.frequency.value = v,
      f.Q.value = 1,
      f.gain.value = hrzGain[i] / 20, f)
  )
  filter.reduce((p, c) => p.connect(c))
}

function moveForward(event, element) {
  forward = (_duration * event.offsetX) / element.clientWidth
  let time_m = (forward / 60).toString()
  // Recalcular el tiempo
  minute = parseInt(time_m.slice(0, time_m.lastIndexOf('.')), 10)
  second = Math.floor(parseFloat(time_m.slice(time_m.lastIndexOf('.'))) * 60)
  millisecond = Math.floor(forward * 100) + 1
  clearInterval(interval)
  // Recalcular el porcentaje de la barra de tiempo
  percent = forward * (100 / _duration)
  // percent = (parseInt(event.offsetX, 10) / 16) * 3
  isMovingForward = true
  source.stop(0)
}

module.exports = Object.freeze({
  setSongs,
  playSong,
  nextSong,
  setFilterVal,
  moveForward
})
