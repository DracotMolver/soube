/**
 * -------------------------- Módulo PlayFile --------------------------------------------------
 * @author Diego Alberto Molina Vera
 *
 * Encargada de reproducir la canción, tocar la siguiente canción o la anterior.
 * Acá se usa la Audio Web API para reproducir la canción y también usar datos
 * obtenidos mediante el buffer.
 */
/* --------------------------------------- Módulos ------------------------------------------- */
const worker = new Worker('../../assets/js/timeWorker.js');
const { dialog } = require('electron').remote;
const path = require('path');
require('./commons');

/* --------------------------------------- Variables ------------------------------------------- */
let isMovingForward = false; // Si se está tratando de adelantar la cación a un tiempo determinado
let isSongPlaying = false; // Se ejecutó play sobre el AudioNode
let isNexAble = false; // Se puede reproducir la siguiente canción
let isPrevExec = false; // Solo se agregan las canciones ya reproducidas cuando se presiona next
let position = null; // Posición de la canción actual
let tmpPosition = []; // Posición de la canción anteriormente reproducida
let filePath = ''; // Ruta de la canción
let songs = {}; // Listado de canciones
let notification = null; // Despliega una notificación de la canción que se va a reproducir

// Variables necesarias para trabajar sobre el AudioContext
const audioContext = new window.AudioContext(); // Objeto AudioContext
const xhtr = new XMLHttpRequest(); // Objeto XMLHttpRequest

// Frecuencias
const hrz = [
 40, 80, 90, 100, 120, 150, 200,
 300, 400, 500, 600, 800, 1000,
 1600, 2000, 3000, 4000, 5000, 6000,
 7000, 8000, 10000, 16000
];

let filter = []; // Array con el filtro a usar en distintas frecuencias
let _duration = 0; // Duración máxima de la canción
let _buffer = {}; // Buffer devuelto por decodeAudioData
let source = {}; // Objeto AudioNode

// Variables para generar el calculo del tiempo transcurrido
// let millisecond = 1;
let interval = null; // Función interval para crear el tiempo de reproducción
let _minute = 0; // Final
let _second = 0; // Final
let forward = 0; // tiempo estimado dónde debería de seguir corriendo la canción al adelantarla
let lapse = 0;
let time = 0; // Tiempo total final
let minute = 0;
let second = 0;
let millisecond = 0;
let percent = 0;

/** --------------------------------------- Funciones --------------------------------------- **/
// Recibe el listado de canciones desde el archivo listSongs.js
function setSongs(_songs) {
  songs = _songs;
  filters();
}

// Retorna un número aleatorio entre 0 y el total de canciones
function shuffle() { return Math.floor(Math.random() * songs.length).toString(); }

// Reproduce una cancion o la pausará
// Responde a todos los posibles estados de una canción
function playSong() {
  if (!isSongPlaying && audioContext.state === 'running') { // Primera vez
    dataSong(shuffle());
    play();

    return 'resume';
  } else if (isSongPlaying && audioContext.state === 'running') { // Ya reproduciendo
    audioContext.suspend().then(() => {
      isSongPlaying = false;
      cancelAnimationFrame(interval);
    });

    return 'paused';
  } else if (!isSongPlaying && audioContext.state === 'suspended') { // Pausado
    isSongPlaying = true;
    startTimer();
    audioContext.resume();

    return 'resume';
  }
}

// Genera el tiempo que lleva reproduciendose la canción
function startTimer() {
  const iter = () => {
    worker.postMessage({ action:'start', per: lapse });
    interval = requestAnimationFrame(iter);
  }
  interval = requestAnimationFrame(iter);

  worker.addEventListener('message', e => {
    $('#time-start').text(e.data.time);
    $('#progress-bar').css(e.data.w);
  });
}

// Límpia el tiempo transcurrido
function stopTimer() {
  if (!isMovingForward) {
    isSongPlaying = false;
    cancelAnimationFrame(interval);
    worker.postMessage({ action: 'stop' });
    $('#time-start').text('00:00');
    _duration = _minute = _second = time =
    minute = second = millisecond = percent = 0;
    if (isNexAble && !isMovingForward) nextSong();
  } else if (isMovingForward) {
    /**
     * La función stop tarda unos milesegundos más que ejecutar la función moveForward.
     * Por lo tanto lo que continua después de detener la canción deberá ser ejecutado
     * dentro de la función onended
     */
    source = audioContext.createBufferSource(); // Se debe crear un nuevo AudioNode, ya que al dar stop el nodo se elimina
    source.onended = stopTimer; // Evento que se gatilla al terminar la canción

    // Conectar todos los nodos
    source.buffer = _buffer;
    source.connect(filter[0])
    .connect(filter[1])
    .connect(filter[2])
    .connect(filter[3])
    .connect(filter[4])
    .connect(filter[5])
    .connect(filter[6])
    .connect(filter[7])
    .connect(filter[8])
    .connect(filter[9])
    .connect(filter[10])
    .connect(filter[11])
    .connect(filter[12])
    .connect(filter[13])
    .connect(filter[14])
    .connect(filter[15])
    .connect(filter[16])
    .connect(filter[17])
    .connect(filter[18])
    .connect(filter[19])
    .connect(filter[20])
    .connect(filter[21])
    .connect(filter[22])
    .connect(audioContext.destination);

    startTimer();
    source.start(0, forward);
    isMovingForward = false;
    isSongPlaying = true;
  }
}

// Recibe la posición de la canción a buscar en el objeto song
// para desplegarlos en la interfaz
function dataSong(_position) {
  if (position !== null && !isPrevExec) tmpPosition.push(position);

  const infoSong = songs[(position = parseInt(_position, 10))];
  filePath = infoSong.filename; // Ruta donde se encuentra el archivo a reproducir

  $('#song-title').data({position}).child().each(v => { v.text(infoSong.title); });
  $('#artist').child().each(v => { v.text(infoSong.artist); });
  $('#album').child().each(v => { v.text(infoSong.album); });

  // Mostrar notificación
  if (notification !== null) { 
    notification.close();
    notification = null
  }

  notification = new Notification(infoSong.title.replace(/\&nbsp;/g, ' '), {
    lang: 'US',
    tag: 'song',
    body: `${infoSong.artist.replace(/\&nbsp;/g, ' ')} from ${infoSong.album.replace(/\&nbsp;/g, ' ')}`,
    icon: path.join(__dirname, '..', 'img', 'play.png')
  });
}

// EJecuta, por medio de la Audio Web API, la canción.
// Se obtiene un array buffer con info útil para usar
function play() {
  // Creamos un Buffer que contendrá la canción
  source = audioContext.createBufferSource();

  // Leer erl achivo de audio
  xhtr.open('GET', `file://${filePath}`, true);
  xhtr.responseType = 'arraybuffer';
  xhtr.onload = () => {
    audioContext.decodeAudioData(xhtr.response).then(buffer => {
      // Para ser usado al momento de querer adelantar la canción
      // El buffer nos entrega la duración de la canción.
      // La duración de la cación está en segundos, por ende hay que pasarla a minutos.
      _buffer = buffer;
      time = ((_duration = _buffer.duration) / 60).toString();
      _minute = parseInt(time.slice(0, time.lastIndexOf('.')), 10);
      _second = Math.floor(parseFloat(time.slice(time.lastIndexOf('.'))) * 60);
      lapse = 100 / _duration; // Porcentaje a usar por cada segundo en la barra de progreso
      $('#time-end').text(`${_minute > 9 ? `${_minute}` : `0${_minute}`}${_second > 9 ? `:${_second}` : `:0${_second}`}`);

      // Evento que se gatilla al terminar la canción
      source.onended = stopTimer;

      // Conectar todos los nodos
      source.buffer = _buffer;
      source.connect(filter[0])
      .connect(filter[1])
      .connect(filter[2])
      .connect(filter[3])
      .connect(filter[4])
      .connect(filter[5])
      .connect(filter[6])
      .connect(filter[7])
      .connect(filter[8])
      .connect(filter[9])
      .connect(filter[10])
      .connect(filter[12])
      .connect(filter[13])
      .connect(filter[14])
      .connect(filter[15])
      .connect(filter[16])
      .connect(filter[17])
      .connect(filter[18])
      .connect(filter[19])
      .connect(filter[20])
      .connect(filter[21])
      .connect(filter[22])
      .connect(audioContext.destination);

      // Inicializar el tiempo y la canción
      startTimer();
      source.start(0);
      isNexAble = isSongPlaying = true;
    }, reason => {
      dialog.showErrorBox('Error [002]', `${jread(LANG_FILE)[jread(CONFIG_FILE).lang].alerts.playSong}\n${reason}`);
      return;
    });
  };
  xhtr.send(null);
}

// Reproduce la siguiente canción.
// Esta función se comparte cuando se genera la lista de canciones,
// ya que al dar click sobre una canción, la que se reproduce es otra ("siguiente").
function nextSong(_position = -1) {
  isPrevExec = false;
  if (_position !== -1) {
    // ver si está reproduciendose o no
    if (isSongPlaying && audioContext.state === 'running' ||
      !isSongPlaying && audioContext.state === 'suspended') {
      if (!isSongPlaying && audioContext.state === 'suspended') audioContext.resume();

      isNexAble = false;
      source.stop(0);
      source = null;
    }
    dataSong(_position)
    play();
  } else {
    // Ver en primera instancia si es posible reproducir la siguiente canción.
    // Esto va a depender de si se ejecutó ya una canción.
    // Si no se válida, podrían reproducirse varias pistas a la vez - No queremos esto :-(
    if (isNexAble) {
      isNexAble = false;
      dataSong(jread(CONFIG_FILE).shuffle ? shuffle() : (songs.length - 1 > position ? position + 1 : 0));
      // si está sonando la canción, esta se debe detener para tocar la nueva
      if (isSongPlaying && audioContext.state === 'running' ||
         !isSongPlaying && audioContext.state === 'suspended') {
        // Verificar si el contexto está pausado o no.
        // Si está pausado no se reproducirá una nueva pista
        if (!isSongPlaying && audioContext.state === 'suspended') audioContext.resume();

        source.stop(0);
        source = null;
      }

      play();
    }
  }
}

// Reproducirá la canción anterior
function prevSong() {
  if (isNexAble && tmpPosition.length > 0) {
    isNexAble = false;
    isPrevExec = true;
    dataSong(tmpPosition.pop());

    // si está sonando la canción, esta se debe detener para tocar la nueva
    if (isSongPlaying && audioContext.state === 'running') {
      source.stop(0);
      source = null;
    }
    // Verificar si el contexto está pausado o no.
    // Si está pausado no se reproducirá una nueva pista
    if (!isSongPlaying && audioContext.state === 'suspended') audioContext.resume();
    play();
  }
}

// Cambia los valores en la frecuencia específica
function setFilterVal(a, b) {
  filter[a].gain.setValueAtTime(b, audioContext.currentTime);
}

// Crea y asigna BiquadFilter de tipo peaking para las siguientes frequencias
// [50, 100, 156, 220, 331, 440, 622, 880, 1250, 1750, 2500, 3500, 5000, 10000, 20000]
function filters() {
  let f = null;
  let db = jread(CONFIG_FILE).equalizer.map(v =>
    v !== 0 ? parseFloat((v < 130 ? (121 - v) : - (v - 140)) / 10) : 0
  );

  hrz.forEach((v, i) => {
    filter.push(
      (f = audioContext.createBiquadFilter(),
      f.type = 'peaking',
      f.frequency.value = v,
      f.Q.value = 1,
      f.gain.value = db[i], f)
    );
  });
}

function moveForward(event, element) {
  forward = _duration * event.offsetX / element.clientWidth;
  const time_m = (forward / 60).toString();

  // Recalcular el tiempo
  minute = parseInt(time_m.slice(0, time_m.lastIndexOf('.')), 10);
  second = Math.floor(parseFloat(time_m.slice(time_m.lastIndexOf('.'))) * 60);
  millisecond = Math.floor(forward * 100) + 1;
  cancelAnimationFrame(interval);

  // Recalcular el porcentaje de la barra de tiempo
  percent = forward * (100 / _duration);
  isMovingForward = true;
  worker.postMessage({
    action: 'forward',
    d: [minute, second, millisecond, percent]
  });
  source.stop(0);
}

module.exports = Object.freeze({
  setSongs,
  playSong,
  prevSong,
  nextSong,
  setFilterVal,
  moveForward
});