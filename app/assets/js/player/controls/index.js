/**
 * @author Diego Alberto Molina Vera
 */
/* --------------------------------------- Modules ------------------------------------------- */
// Nodejs modules
const path = require('path');

// Electron modules
const dialog = require('electron').remote.dialog;

// Own modules
const {
    configFile,
    langFile,
    listSongs,
    editFile
} = require('./../../config').init();
require('./../../dom');

/* --------------------------------------- Variables ------------------------------------------- */
//---- normals ----
let poolOfSongs = {}; // Will keep all the AudioBuffers
let lang = langFile[configFile.lang];
let isMovingForward = false; // Step the song time
let isNextAble = false; // if the next song can be played (needed because AudioNode.stop() works with Promise)
let isSongPlaying = false; // It's AudioNode playing
let position = Math.floor(Math.random() * listSongs.length); // Position of the song to play for the very first time.
let prevSongsToPlay = []; // Will keep all the filename of old songs
let file = ''; // Will keep the data song info
let oldFile = ''; // Will keep the data of the song played
let playedAtPosition = false // If the song is clicked on from the list
let filter = []; // Array for createBiquadFilter to use the Frequencies
let duration = 0; // max duration of the song
let source = null; // AudioNode object
let lapse = 0;
let time = 0;
let minute = 0;
let second = 0;
let notification = null;
let notifi = {
  lang: 'US',
  tag: 'song',
  silent: false,
  icon: path.join(__dirname, '../../../', 'img', 'play.png')
};

//---- constants ----
const audioContext = new window.AudioContext(); // Object AudioContext
const xhtr = new XMLHttpRequest(); // Object XMLHttpRequest
const hrz = [ // Frequencies
 40, 80, 90, 100, 120, 150, 200,
 300, 400, 500, 600, 800, 1000,
 1600, 2000, 3000, 4000, 5000, 6000,
 7000, 8000, 10000, 16000
];

// Cords to generate the animation
// Google Chrome is throwing the next warning message:
// ** SVG's SMIL animations (<animate>, <set>, etc.) are deprecated and
// will be removed. Please use CSS animations or Web animations instead.**-
// For now all works fine. :P
const anim = {
  from: [
    'M 5.827315,6.7672041 62.280287,48.845328 62.257126,128.62684 5.8743095,170.58995 Z',
    'm 61.189203,48.025 56.296987,40.520916 0,0.0028 -56.261916,40.850634 z'
  ],
  to: [
    'M 5.827315,6.7672041 39.949651,6.9753863 39.92649,170.36386 5.8743095,170.58995 Z',
    'm 83.814203,6.9000001 34.109487,0.037583 -0.0839,163.399307 -33.899661,0.16304 z'
  ]
};

// Workers
const timeWorker = new Worker(path.join(__dirname, '../../../', 'js/worker', 'index.js'));


// // let millisecond = 1;
let interval = null;
// let forward = 0;
let millisecond = 0;
// let percent = 0;

// /** --------------------------------------- Functions --------------------------------------- **/

// Activar shuffle
function shuffle() {
  configFile.shuffle = !configFile.shuffle;
  $('#shuffle-icon').css(configFile.shuffle ? 'fill:#FBFCFC' : 'fill:#f06292');
  editFile('config', configFile);
}

// // Retorna un número aleatorio entre 0 y el total de canciones
// function shuffle() { return Math.floor(Math.random() * songs.length); }

// Animation of the play/pause button when it sets to play
function animPlayAndPause(animName) {
  const animAttr = i => {
    return animName === 'play' ?
    { from: anim.from[i], to: anim.to[i] } :
    { from: anim.to[i], to: anim.from[i] };
  };

  $('.anim-play').each((v, i) => {
    $(v).attr(animAttr(i)).get().beginElement();
  });
}

function playSongAtPosition(pos = -1) {
  if (source !== null) {
    source.stop(0);
    source = null;
  }

  file = '';
  playedAtPosition = true;
  position = pos;
  initSong();
}

function playSong() {
  if (!isSongPlaying && audioContext.state === 'running') { // Reproducción única
    initSong();

    return 'resume';
  } else if (isSongPlaying && audioContext.state === 'running') { // Ya reproduciendo
    audioContext.suspend().then(() => {
      isSongPlaying = false;
      cancelAnimationFrame(interval);
    });
    animPlayAndPause('pause');

    return 'paused';
  } else if (!isSongPlaying && audioContext.state === 'suspended') { // Pausado
    isSongPlaying = true;
    startTimer();
    audioContext.resume();
    animPlayAndPause('play');

    return 'resume';
  }
}

// Lapse of the time
function startTimer() {
  timeWorker.onmessage = e => {
    $('#time-start').text(e.data.time);
    $('#progress-bar').css(e.data.w);
  };

  (function iter() {
    timeWorker.postMessage({ action:'start', per: lapse });
    interval = requestAnimationFrame(iter);
  })();
}

// Límpia el tiempo transcurrido
function stopTimer() {
  // $(`#${oldFile.position}`).child().each(v => { $(v).css('color:#424949'); });

  if (!isMovingForward) {
    isSongPlaying = false;
    cancelAnimationFrame(interval);
    timeWorker.postMessage({ action: 'stop' });

    isNextAble = true;
    if (isNextAble && !isMovingForward) initSong();
  } else if (isMovingForward) {

    // It must be created a new AudioNode, because the stop function delete the node.
    source = audioContext.createBufferSource();
    source.onended = stopTimer;

    // Conectar todos los nodos
    source.buffer = poolOfSongs[oldFile.filename];
    source.connect(filter[0]);
    filter.reduce((p, c) => p.connect(c)).connect(audioContext.destination);

    startTimer();
    source.start(0, forward);
    isMovingForward = false;
    isSongPlaying = true;
  }
}

// Busca y despliega los datos de la canción
function dataSong(file) {
  $('#time-start').text('00:00');
  $('#progress-bar').css('width:0');
  $('#song-title').data({position: file.position}).child().each(v => { $(v).text(file.title); });
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
  return listSongs[playedAtPosition ? position : (configFile.shuffle ? Math.floor(Math.random() * listSongs.length) : ++position)];
}

function initSong() {
  animPlayAndPause('play');

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

    // Change the color the actual song
    // $(`#${file.position}`).child().each(v => { $(v).css('color:#e91e63'); });

    // Start timer
    startTimer();
    source.start(0);
    isSongPlaying = true;
  }

  // Obtener los datos de la primera canción a reproducir
  if (poolOfSongs[file.filename]) {
    // Canción a tocar
    dataSong((oldFile = file));
    setSong(poolOfSongs[file.filename]);
    playedAtPosition = false;

    // Siguiente canción
    file = getFile();
    getBuffer(file.filename, data => {
      if (!data) throw data;

      isNextAble = true;
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
      dataSong((oldFile = file));
      setSong(data);
      playedAtPosition = false;

      // Siguiente canción.
      // Si ya existe no guardar.
      file = getFile();
      if (!poolOfSongs[file.filename]) {
        getBuffer(file.filename, data => {
          if (!data) throw data;

          isNextAble = true;
          setBufferInPool(file.filename, data);
        });
      }
    });
  }
}

// Reproduce la siguiente canción.
// Esta función se comparte cuando se genera la lista de canciones,
// ya que al dar click sobre una canción, la que se reproduce es otra ("siguiente").
function nextSong() {
  if (isNextAble) {
    prevSongsToPlay.push(oldFile);

    // Verificar si el contexto está pausado o no.
    if (!isSongPlaying && audioContext.state === 'suspended') audioContext.resume();

    if(source !== null) {
      source.stop(0);
      source = null;
    }
    isNextAble = false;
  }
}

// Reproducirá la canción anterior
function prevSong() {
  if (prevSongsToPlay.length > 0 && isNextAble) {
    file = prevSongsToPlay.pop();
    position = file.position;

    // Verificar si el contexto está pausado o no.
    if (!isSongPlaying && audioContext.state === 'suspended') audioContext.resume();

    if(source !== null) {
      source.stop(0);
      source = null;
    }

    isNextAble = false;
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
  let db = configFile.equalizer[configFile.equalizerConfig].map(v =>
    v !== 0 ? parseFloat((v < 130 ? 121 - v : -v + 140) / 10) : 0
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

function moveForward(event, element) {
  isMovingForward = true;
  var x =source.stop(0);
  cancelAnimationFrame(interval);

  forward = duration * event.offsetX / element.clientWidth;
  time = (forward / 60).toString();

  // Calculate the time it should be playing the song
  minute = parseInt(time.slice(0, time.lastIndexOf('.')));
  second = Math.floor(time.slice(time.lastIndexOf('.')) * 60);
  millisecond = forward * 100 + 1;

  // Calculate the percent of the progress bar
  percent = forward * (100 / duration);
  timeWorker.postMessage({
    action: 'forward',
    d: [minute, second, millisecond, percent]
  });
}

module.exports = {
  nextSong,
  prevSong,
  playSong,
  shuffle,
  setFilterVal,
  moveForward,
  playSongAtPosition
}