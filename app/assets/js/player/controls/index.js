/**
 * @author Diego Alberto Molina Vera
 * @copyright 12016 - 2017
 */
/* --------------------------------------- Modules ------------------------------------------- */
//---- nodejs ----
const path = require('path');

//---- electron ----
const dialog = require('electron').remote.dialog;

//---- own ----
const {
    configFile,
    langFile,
    listSongs,
    editFile
} = require('./../../config').init();
require('./../../dom');
const timeWorker = new Worker(path.join(__dirname, '../../../', 'js/worker', 'timer.js'));

/* --------------------------------------- Variables ------------------------------------------- */
//---- normals ----
let poolOfSongs = {}; // Will keep all the AudioBuffers
let lang = langFile[configFile.lang];
let isMovingForward = false; // if is using the progress bar of the song
let isNextAble = false; // if the next song can be played (needed because AudioNode.stop() works with Promise)
let isSongPlaying = false; // It's the AudioNode playing
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
let interval = null;
let millisecond = 0;
let notifi = {
  lang: 'US',
  tag: 'song',
  silent: false,
  icon: path.join(__dirname, '../../../', 'img', 'play.png')
};

//---- constants ----
const SECONDS_U = 60;
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

/** --------------------------------------- Functions --------------------------------------- **/
// Enable shuffle
function shuffle() {
  configFile.shuffle = !configFile.shuffle;
  $('#shuffle-icon').css(configFile.shuffle ? 'fill:#FBFCFC' : 'fill:#f06292');
  editFile('config', configFile);
}

// Animation of the play/pause buttons
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

// Lapse of time
function startTimer() {
  // Time
  timeWorker.onmessage = e => {
    $('#time-start').text(e.data.time);
    $('#progress-bar').css(e.data.w);
  };

  const TIME_ITER = () => {
    timeWorker.postMessage({ action:'start', per: lapse });
    interval = requestAnimationFrame(TIME_ITER);
  };
  interval = requestAnimationFrame(TIME_ITER);
}

// Clean the everything when the ended function is executed
function stopTimer() {
  $(`#${oldFile.position}`).child().each(v => { $(v).css('color:#424949'); });

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

    // connect all the nodes
    source.buffer = poolOfSongs[oldFile.filename];
    source.connect(filter[0]);
    filter.reduce((p, c) => p.connect(c)).connect(audioContext.destination);

    startTimer();
    source.start(0, forward);
    isMovingForward = false;
    isSongPlaying = true;
  }
}

// Show the data of the selected song
function dataSong(file) {
  $('#time-start').text('00:00');
  $('#progress-bar').css('width:0');
  $('#song-title').data({position: file.position}).child().each(v => { $(v).text(file.title); });
  $('#artist').child().each(v => { $(v).text(file.artist); });
  $('#album').child().each(v => { $(v).text(file.album); });

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
  return listSongs[
    playedAtPosition ? position :
      (configFile.shuffle ? Math.floor(Math.random() * listSongs.length) : ++position
    )];
}

function formatDecimals(decimal) {
  return decimal > 9 ? `${decimal}` : `0${decimal}`;
}

function initSong() {
  animPlayAndPause('play');

  // Get the buffer of the song
  const getBuffer = (filePath, fnc) => {
    // Read the file
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

  const setSong = (buffer) => {
    source = audioContext.createBufferSource();

    // The buffer gives us the song's duration.
    // The duration is in seconds, therefore we need to convert it to minutes
    time = ((duration = buffer.duration) / SECONDS_U).toString();
    minute = parseInt(time.slice(0, time.lastIndexOf('.')));
    second = Math.floor(time.slice(time.lastIndexOf('.')) * SECONDS_U);
    lapse = 100 / duration; // Porcentaje a usar por cada segundo en la barra de progreso
    $('#time-end').text(`${formatDecimals(minute)}:${formatDecimals(second)}`);

    source.onended = stopTimer;

    // connect all the nodes
    source.buffer = buffer;
    source.connect(filter[0]);
    filter.reduce((p, c) => p.connect(c)).connect(audioContext.destination);

    // Change the color the actual song
    $(`#${file.position}`).child().each(v => { $(v).css('color:#e91e63'); });

    startTimer();
    source.start(0);
    isSongPlaying = true;
  }

  // Get the buffer of song if it is in the poolOfSongs
  // Note: The oldFile is an important variable, because is saved into
  // the prevSongsToPlay array, which has all the played songs.
  if (poolOfSongs[file.filename]) {
    // play the song and save it as an old song (oldFile)
    dataSong((oldFile = file));
    setSong(poolOfSongs[file.filename]); // Set the buffer
    playedAtPosition = false;

    // Next (possible) song to play
    // if it is not saved into the buffer, we have to get it and save it
    file = getFile();
    if (!poolOfSongs[file.filename]) {
      getBuffer(file.filename, data => {
        if (!data) throw data;

        isNextAble = true;
        setBufferInPool(file.filename, data);
      });
    }
  } else {
    // Get the song to play
    file = getFile();
    getBuffer(file.filename, data => {
      if (!data) throw data;

      // Save the buffer
      setBufferInPool(file.filename, data);

      // Play the song and save it as old (oldFile)
      dataSong((oldFile = file));
      setSong(data);
      playedAtPosition = false;

      // Next (possible) song to play
      // if it is not saved into the buffer, we have to get it and save it
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

function nextSong() {
  if (isNextAble) {
    // oldFile saved
    prevSongsToPlay.push(oldFile);

    if (!isSongPlaying && audioContext.state === 'suspended') audioContext.resume();

    if(source !== null) {
      source.stop(0);
      source = null;
    }

    isNextAble = false;
  }
}

function prevSong() {
  if (prevSongsToPlay.length > 0 && isNextAble) {
    file = prevSongsToPlay.pop();
    position = file.position;

    if (!isSongPlaying && audioContext.state === 'suspended') audioContext.resume();

    if(source !== null) {
      source.stop(0);
      source = null;
    }

    isNextAble = false;
  }
}

function setFilterVal(a, b) {
  filter[a].gain.setValueAtTime(b, audioContext.currentTime);
}

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
  cancelAnimationFrame(interval); // Time
  ca

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