/**
 * @author Diego Alberto Molina Vera
 */
// /* --------------------------------------- Módulos ------------------------------------------- */
// const worker = new Worker('../../assets/js/timeWorker.js');
// Nodejs módulos
const path = require('path');

// Electron módulos
const dialog = require('electron').remote.dialog;

const {
    configFile,
    langFile,
    listSongs,
    editFile
} = require('./../../config').init();
require('./../../dom');

/* --------------------------------------- Variables ------------------------------------------- */
let poolOfSongs = {};
let lang = langFile[configFile.lang];

let isMovingForward = false; // Si se está tratando de adelantar la cación a un tiempo determinado
let isNextAble = true;
let isSongPlaying = false; // Se ejecutó play sobre el AudioNode
let position = Math.floor(Math.random() * listSongs.length); // Posición de la canción actual
// let tmpPosition = []; // Posición de la canción anteriormente reproducida
let file = ''; // Ruta de la canción
// let songs = {}; // Listado de canciones
// let infoSong = {};

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
let duration = 0; // Duración máxima de la canción
// let buffer = {}; // Buffer devuelto por decodeAudioData
let source = null; // Objeto AudioNode

// // Variables para generar el calculo del tiempo transcurrido
// // let millisecond = 1;
// let interval = null; // Función interval para crear el tiempo de reproducción
// let forward = 0; // tiempo estimado dónde debería de seguir corriendo la canción al adelantarla
let lapse = 0;
let time = 0; // Tiempo total final
let minute = 0;
let second = 0;
// let millisecond = 0;
// let percent = 0;
// let time_m = 0;

// Notificación
let notification = null; // Despliega una notificación de la canción que se va a reproducir
let notifi = {
  lang: 'US',
  tag: 'song',
  silent: false,
  icon: path.join(__dirname, '../../../', 'img', 'play.png')
};

// // Para generar la animación del botón play
// const anim = {
//   from: [
//     'M 5.827315,6.7672041 62.280287,48.845328 62.257126,128.62684 5.8743095,170.58995 Z',
//     'm 61.189203,48.025 56.296987,40.520916 0,0.0028 -56.261916,40.850634 z'
//   ],
//   to: [
//     'M 5.827315,6.7672041 39.949651,6.9753863 39.92649,170.36386 5.8743095,170.58995 Z',
//     'm 83.814203,6.9000001 34.109487,0.037583 -0.0839,163.399307 -33.899661,0.16304 z'
//   ]
// };

// /** --------------------------------------- Funciones --------------------------------------- **/

// Activar shuffle
function shuffle() {
  configFile.shuffle = !configFile.shuffle;
  $('#shuffle-icon').css(configFile.shuffle ? 'fill:#FBFCFC' : 'fill:#f06292');
  editFile('config', configFile);
}

// // Retorna un número aleatorio entre 0 y el total de canciones
// function shuffle() { return Math.floor(Math.random() * songs.length); }

// function animPlay() {
//   $('.anim-play').each((v, i) => {
//     v.attr({ 'from': anim.from[i], 'to': anim.to[i] }).get().beginElement();
//   })
// }

// function animPause() {
//   $('.anim-play').each((v, i) => {
//     v.attr({ 'from': anim.to[i], 'to': anim.from[i] }).get().beginElement();
//   });
// }

function playSong() {
  if (!isSongPlaying && audioContext.state === 'running') { // Reproducción única
    // Buscará dos canciones. La primera seleccionada o al azar
    // y la segunda que es la siguiente (shuffle off) o la siguiente al azar (shuffle on)
    initSong();
//     if (position === null) dataSong(shuffle());
//     play();
//     animPlay();

    return 'resume';
  } else if (isSongPlaying && audioContext.state === 'running') { // Ya reproduciendo
    audioContext.suspend().then(() => {
      isSongPlaying = false;
//       cancelAnimationFrame(interval);
    });
//     animPause();

    return 'paused';
  } else if (!isSongPlaying && audioContext.state === 'suspended') { // Pausado
    isSongPlaying = true;
//     startTimer();
    audioContext.resume();
//     animPlay();

    return 'resume';
  }
}

// // Genera el tiempo que lleva reproduciendose la canción
// function startTimer() {
//   worker.onmessage = e => {
//     console.log(e);
//     // $('#time-start').text(e.data.time);
//     // $('#progress-bar').css(e.data.w);
//   };

//   // const iter = () => {
//     worker.postMessage({ action:'start', per: lapse });
//     // interval = requestAnimationFrame(iter);
//   // }
//   // interval = requestAnimationFrame(iter);

// }

// Límpia el tiempo transcurrido
function stopTimer() {
  if (!isMovingForward) {
    isSongPlaying = false;

//     cancelAnimationFrame(interval);
//     worker.postMessage({ action: 'stop' });
//     worker.terminate();

//     _duration = _minute = _second = time =
//     minute = second = millisecond = percent = 0;

    if (isNextAble && !isMovingForward) nextSong();
  } else if (isMovingForward) {
//     /**
//      * La función stop tarda unos milesegundos más que ejecutar la función moveForward.
//      * Por lo tanto lo que continua después de detener la canción deberá ser ejecutado
//      * dentro de la función onended
//      */
//     source = audioContext.createBufferSource(); // Se debe crear un nuevo AudioNode, ya que al dar stop el nodo se elimina
//     source.onended = stopTimer; // Evento que se gatilla al terminar la canción

//     // Conectar todos los nodos
//     source.buffer = _buffer;
//     source.connect(filter[0])
//     filter.reduce((p, c) => p.connect(c))
//     .connect(audioContext.destination);

//     startTimer();
//     source.start(0, forward);
//     isMovingForward = false;
//     isSongPlaying = true;
  }
}

// Busca y despliega los datos de la canción
function dataSong(file) {
  $('#time-start').text('00:00');
  $('#progress-bar').css('width:0');

  $('#song-title').child().each(v => { $(v).text(file.title); });
  $('#artist').child().each(v => { $(v).text(file.artist); });
  $('#album').child().each(v => { $(v).text(file.album); });

  // Mostrar notificación
  if (notification !== null) {
    notification.close();
    notification = null
  }

  notifi.body = `${file.artist.replace(/\&nbsp;/g, ' ')} from ${file.album.replace(/\&nbsp;/g, ' ')}`;
  notification = new Notification(file.title.replace(/\&nbsp;/g, ' '), notifi);
}

function setBufferInPool(filePath, buffer) {
  if (!poolOfSongs[filePath]) poolOfSongs[filePath] = buffer;
}

function getFile() {
  // Revisar si está activado el shuffle o no
  return listSongs[configFile.shuffle ? Math.floor(Math.random() * listSongs.length) : position++];
}

function initSong() {
  // Obtener buffer de la canción
  const getBuffer = (filePath, fnc) => {
    // Leer erl achivo de audio
    xhtr.open('GET', `file://${filePath}`, true);
    xhtr.responseType = 'arraybuffer';
    xhtr.onload = () => {
      audioContext.decodeAudioData(xhtr.response).then(buffer => {
        fnc(buffer);
      }, reason => {
        dialog.showErrorBox('Error [002]', `${lang.alerts.playSong}\n${reason}`);
        fnc(false);
      });
    }
    xhtr.send(null);
  };

  // Preparar todo para reproducir la canción
  const setSong = (buffer) => {
    // Creamos un Buffer que contendrá la canción
    source = audioContext.createBufferSource();

    // Para ser usado al momento de querer adelantar la canción
    // El buffer nos entrega la duración de la canción.
    // La duración de la cación está en segundos, por lo tanto, hay que pasarla a minutos.
    time = ((duration = buffer.duration) / 60).toString();
    minute = parseInt(time.slice(0, time.lastIndexOf('.')), 10);
    second = Math.floor(time.slice(time.lastIndexOf('.')) * 60);
    lapse = 100 / duration; // Porcentaje a usar por cada segundo en la barra de progreso
    $('#time-end').text(`${minute > 9 ? `${minute}` : `0${minute}`}${second > 9 ? `:${second}` : `:0${second}`}`);

    // Evento que se gatilla al terminar la canción
    source.onended = stopTimer;

    // Conectar todos los nodos
    source.buffer = buffer;
    source.connect(filter[0]);
    filter.reduce((p, c) => p.connect(c)).connect(audioContext.destination);

    // Inicializar el tiempo y la canción
    // startTimer();
    source.start(0);
    isNextAble = isSongPlaying = true;
  }


  // Obtener los datos de la primera canción a reproducir
  if (poolOfSongs[file.filename]) {
    // Canción a tocar
    dataSong(file);
    setSong(poolOfSongs[file.filename]);

    // Siguiente canción
    file = getFile();
    getBuffer(file.filename, data => {
      if (!data) throw data;

      setBufferInPool(file.filename, data);
    });
  } else { // Se ejecuta una sola vez
    // Canción a tocar
    file = getFile();
    getBuffer(file.filename, data => {
      if (!data) throw data;

      // Guardar buffer
      setBufferInPool(file.filename, data);

      // Tocar canción
      dataSong(file);
      setSong(data);

      // Siguiente canción.
      // Si ya existe no guardar.
      file = getFile();
      console.log(file.filename);
      if (!poolOfSongs[file.filename]) {
        getBuffer(file.filename, data => {
          if (!data) throw data;

          setBufferInPool(file.filename, data);
        });
      }
    });
  }
}

// Reproduce la siguiente canción.
// Esta función se comparte cuando se genera la lista de canciones,
// ya que al dar click sobre una canción, la que se reproduce es otra ("siguiente").
function nextSong(/*_position = -1*/) {
  if (isNextAble) {
    if (!isSongPlaying && audioContext.state === 'suspended') audioContext.resume();
//     tmpPosition.push(position);

    isNextAble = isSongPlaying = false;
    if(source !== null) {
      source.stop(0);
      source = null;
    }


//     dataSong(_position !== -1 ? _position : (
//       jread(CONFIG_FILE).shuffle ? shuffle() : (songs.length - 1 > position ? position + 1 : 0)
//     ));

    playSong();
  }
}

// // Reproducirá la canción anterior
// function prevSong() {
//   if (isNextAble && (tmpPosition.length > 0 || tmpPosition[0] !== null)) {
//     dataSong(tmpPosition.pop());

//     // Verificar si el contexto está pausado o no.
//     // Si está pausado no se reproducirá una nueva pista
//     if (!isSongPlaying && audioContext.state === 'suspended') audioContext.resume();

//     isNextAble = isSongPlaying = false;
//     if(source !== null) {
//       source.stop(0);
//       source = null;
//     }

//     playSong();
//   }
// }

// Cambia los valores en la frecuencia específica
function setFilterVal(a, b) {
  filter[a].gain.setValueAtTime(b, audioContext.currentTime);
}

// Crea y asigna BiquadFilter de tipo peaking para las siguientes frequencias
// [50, 100, 156, 220, 331, 440, 622, 880, 1250, 1750, 2500, 3500, 5000, 10000, 20000]
function filters() {
  let f = null;
  let db = configFile.equalizer.map(v =>
    v !== 0 ? parseFloat((v < 130 ? 121 - v : - v + 140) / 10) : 0
  );

  filter = hrz.map((v, i) =>
      (f = audioContext.createBiquadFilter(),
      f.type = 'peaking',
      f.frequency.value = v,
      f.Q.value = 1,
      f.gain.value = db[i], f)
  );
}
filters();

// function moveForward(event, element) {
//   forward = _duration * event.offsetX / element.clientWidth;
//   time_m = (forward / 60).toString();

//   // Recalcular el tiempo
//   minute = parseInt(time_m.slice(0, time_m.lastIndexOf('.')), 10);
//   second = Math.floor(time_m.slice(time_m.lastIndexOf('.')) * 60);
//   millisecond = forward * 100 + 1;
//   cancelAnimationFrame(interval);

//   // Recalcular el porcentaje de la barra de tiempo
//   percent = forward * (100 / _duration);
//   isMovingForward = true;
//   worker.postMessage({
//     action: 'forward',
//     d: [minute, second, millisecond, percent]
//   });
//   source.stop(0);
// }

module.exports = {
  // nextSong,
  // prevSong,
  playSong,
  shuffle,
  setFilterVal
}