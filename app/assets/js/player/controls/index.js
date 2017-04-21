/**
 * @author Diego Alberto Molina Vera
 * @copyright 12016 - 2017
 */
/* --------------------------------------- Modules ------------------------------------------- */
//---- Node ----
const path = require('path');
const url = require('url');

//---- Electron ----
const ipcRenderer = require('electron').ipcRenderer;

//---- Own ----
const {
  configFile,
  langFile,
  listSongs,
  editFile
} = require(path.join(__dirname, '../../', 'config')).init();
require(path.join(__dirname, '../../', 'dom'));

/* --------------------------------------- Variables ------------------------------------------- */
let poolOfSongs = {};                                        // Will keep all the AudioBuffers
let lang = langFile[configFile.lang];

//---- Song ----
let isplayedAtPosition = false                               // If the song is clicked on from the list
let isMovingForward = false;                                 // if is using the progress bar of the song
let isSongPlaying = false;                                   // It's the AudioNode playing
let isNextAble = false;                                      // if the next song can be played
let prevSongsToPlay = [];                                    // Will keep all the filename of old songs
let filter = [];                                             // Array for createBiquadFilter to use the Frequencies
let oldFile = '';                                            // Will keep the data of the song played
let file = '';                                               // Will keep the data song info
let position = Math.floor(Math.random() * listSongs.length); // Position of the song to play for the very first time.
let duration = 0;                                            // max duration of the song
let source = null;                                           // AudioNode object

//---- Elapsed time ----
let lastCurrentTime = 0;
let millisecond = 0;
let percent = 0;
let minute = 0;
let second = 0;
let lapse = 0;
let interval = null;
let time = {};

//---- Notification ----
let notification = null;
let notifi = {
  lang: 'US',
  tag: 'song',
  silent: false,
  icon: path.join(__dirname, '../../../', 'img', 'play.png')
};

//---- constants ----
const seconds_u = 60;
const audioContext = new window.AudioContext();
const xhtr = new XMLHttpRequest();
const hrz = [
 50, 100, 156, 220, 311, 440, 622, 880, 1250, 1750, 2500, 3500, 5000, 10000, 20000
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
  file = '';
  configFile.shuffle = !configFile.shuffle;
  $('#shuffle-icon').css(`fill:${configFile.shuffle ? '#FBFCFC' : '#f06292'}`);

  editFile('config', configFile);
}

// Animation of the play/pause buttons
function animPlayAndPause(animName) {
  const animAttr = i => {
    return animName === 'play' ?
    { from: anim.from[i], to: anim.to[i] } :
    { from: anim.to[i], to: anim.from[i] };
  };

  $('.anim-play').each((v, i) => $(v).attr(animAttr(i)).get().beginElement());
}

function playSongAtPosition(pos = -1) {
  if (source !== null) {
    source.stop(0);
    source = null;
  }

  if (oldFile !== '') prevSongsToPlay.push(oldFile);

  file = '';
  isplayedAtPosition = true;
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
    });

    cancelAnimationFrame(interval);
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
  const update = () => {
    if (++millisecond > 59) {
      millisecond = 0;
      if (++second > 59) {
        ++minute;
        second = 0;
      }

      $('#time-start').text(`${formatDecimals(minute)}:${formatDecimals(second)}`);
      $('#progress-bar').css(`width:${percent += lapse}%`);
    }
    interval = requestAnimationFrame(update);
  };
  interval = requestAnimationFrame(update);
}

// Clean the everything when the ended function is executed
function stopTimer() {
  if (!isMovingForward) {
    $(`#${oldFile.position}`).child().each(v => { $(v).css('color:#424949'); });

    isSongPlaying = false;
    isNextAble = true;
    millisecond = second = minute = percent = lapse = 0;

    cancelAnimationFrame(interval);

    if (isNextAble && !isMovingForward && !isplayedAtPosition) initSong();
  } else if (isMovingForward) {

    // It must be created a new AudioNode, because the stop function delete the node.
    setAudioBufferToPlay(poolOfSongs[oldFile.filename]);

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

  notifi.body = `${nbspToSpace(file.artist)} from ${nbspToSpace(file.album)}`;
  notification = new Notification(nbspToSpace(file.title), notifi);
}

function setBufferInPool(filePath, buffer) {
  if (!poolOfSongs[filePath]) poolOfSongs[filePath] = buffer;
}

function getFile() {
  return listSongs[
    isplayedAtPosition ? position :
      (configFile.shuffle ?
        Math.floor(Math.random() * listSongs.length) :
          (position === listSongs.length - 1 ? position = 0 : ++position)
  )];
}

function formatDecimals(decimal) {
  return decimal > 9 ? `${decimal}` : `0${decimal}`;
}

// This function recive the buffer of the song to be played
// Also start the song
function setAudioBufferToPlay(buffer) {
  source = audioContext.createBufferSource();
  source.onended = stopTimer;
  source.buffer = buffer;

  // connect all the nodes
  source.connect(filter[0]);
  filter.reduce((p, c) => p.connect(c)).connect(audioContext.destination);
  startTimer();
  isMovingForward ? source.start(0, forward) : source.start(0);
  lastCurrentTime = audioContext.currentTime;
  $($('.grid-container').get(0)).rmAttr('style');
  $('#spinner').switchClass('spinner-anim', 'hide');

  // Set the name of the song in the top bar
  ipcRenderer.send('update-title', `${nbspToSpace(file.title)} - ${nbspToSpace(file.artist)} - Soube`);
}

function initSong() {
  animPlayAndPause('play');

  $($('.grid-container').get(0)).css('-webkit-filter:blur(1px)');
  $('#spinner').switchClass('hide', 'spinner-anim');

  // Get the buffer of the song
  const getBuffer = (_path, fnc) => {
    // Read the file
    xhtr.open('GET', `file://${_path}`, true);
    xhtr.responseType = 'arraybuffer';
    xhtr.onload = () => audioContext.decodeAudioData(xhtr.response).then(buffer => fnc(buffer), reason => fnc(false));

    xhtr.send(null);
  };

  const setSong = buffer => {
    setAudioBufferToPlay(buffer);

    // The buffer gives us the song's duration.
    // The duration is in seconds, therefore we need to convert it to minutes
    time = timeParse((duration = buffer.duration));
    lapse = 100 / duration;

    $('#time-end').text(`${formatDecimals(time.minute)}:${formatDecimals(time.second)}`);

    // Change the color the actual song
    $(`#${file.position}`).child().each(v => { $(v).css('color:#e91e63'); });

    isSongPlaying = true;
  }

  const nextPossibleSong = () => {
    isplayedAtPosition = false;
    position = oldFile.position;

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
  };

  // Get the buffer of song if it is in the poolOfSongs
  // Note: The oldFile is an important variable, because is saved into
  // the prevSongsToPlay array, which has all the played songs.
  if (poolOfSongs[file.filename]) {
    // play the song and save it as an old song (oldFile)
    setSong(poolOfSongs[file.filename]);
    dataSong((oldFile = file));
    nextPossibleSong();
  } else {
    // Get the song to play
    file = getFile();
    getBuffer(file.filename, data => {
      if (!data) throw data;

      // Save the buffer
      setBufferInPool(file.filename, data);

      // Play the song and save it as old (oldFile)
      setSong(data);
      dataSong((oldFile = file));
      nextPossibleSong();
    });
  }
}

function checkNextAndPrevSong() {
    if (!isSongPlaying && audioContext.state === 'suspended') audioContext.resume();

    if(source !== null) {
      source.stop(0);
      source = null;
    }

    isNextAble = false;
}

function nextSong() {
  if (isNextAble) {
    // oldFile saved
    prevSongsToPlay.push(oldFile);

    checkNextAndPrevSong();
  }
}

function prevSong() {
  if (prevSongsToPlay.length > 0 && isNextAble) {
    file = prevSongsToPlay.pop();
    position = file.position;

    checkNextAndPrevSong();
  }
}

function setFilterVal(a, b) {
  filter[a].gain.setValueAtTime(b, audioContext.currentTime);
}

function filters() {
  let f = null;
  let db = configFile.equalizer[configFile.equalizerConfig]
    .map(v => v === 0 ? 0 : (v === 12 ? 12 : (12 - (v / 10)).toFixed(1)));

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

  cancelAnimationFrame(interval);

  forward = duration * event.offsetX / element.clientWidth;
  time = timeParse(forward);

  // Calculate the new time
  minute = time.minute;
  second = time.second;
  millisecond = forward * 100;

  // Calculate the percent of the progress bar
  percent = forward * (100 / duration);
  source.stop(0);
}

function saveCurrentTime() {
  lastCurrentTime = audioContext.currentTime;
}

function updateCurrentTime() {
  let totalTime = Math.floor(audioContext.currentTime - lastCurrentTime);

  if (totalTime > seconds_u) {
    time =  timeParse(totalTime);
    minute += time.minute;
    second += time.second;
    percent += lapse * Math.floor(audioContext.currentTime - lastCurrentTime);
  }
}

function timeParse(_time) {
  _time = (_time / seconds_u).toString();

  return {
    minute: parseInt(_time.slice(0, _time.lastIndexOf('.'))),
    second: Math.floor(_time.slice(_time.lastIndexOf('.')) * seconds_u)
  }
}

function nbspToSpace(value) {
  return value.replace(/\&nbsp;/g, ' ');
}

module.exports = {
  nextSong,
  prevSong,
  playSong,
  shuffle,
  setFilterVal,
  moveForward,
  playSongAtPosition,
  saveCurrentTime,
  updateCurrentTime
}