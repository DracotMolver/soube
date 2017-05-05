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
let {
  configFile,
  langFile,
  listSongs,
  editFile
} = require(path.join(__dirname, '../../', 'config')).init();
const $ = require(path.join(__dirname, '../../', 'dom'));


/* --------------------------------------- Variables ------------------------------------------- */
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


/* --------------------------------------- Functions ------------------------------------------- */
function formatDecimals(decimal) {
  return decimal > 9 ? `${decimal}` : `0${decimal}`;
}

function timeParse(_time) {
  _time = (_time / seconds_u).toString();

  return {
    minute: parseInt(_time.slice(0, _time.lastIndexOf('.'))),
    second: Math.floor(_time.slice(_time.lastIndexOf('.')) * seconds_u)
  };
};

function animPlayAndPause(animName) {
  if (process.platform === 'win32') {
    animName === 'play' ?
      ipcRenderer.send('thumb-bar-update', 'pauseMomment') :
      ipcRenderer.send('thumb-bar-update', 'playMomment');
  }

  $('.anim-play').each(function (v, i) {
    $(v).attr(animName === 'play' ?
      { from: anim.from[i], to: anim.to[i] } :
      { from: anim.to[i], to: anim.from[i] }
    ).get().beginElement();
  });
}

function nbspToSpace(value) {
  return value.replace(/\&nbsp;/g, ' ');
}

/* --------------------------------------- Class ------------------------------------------- */
const Controls = function (from) {
  /* --------------------------------------- Variables ------------------------------------------- */
  this.poolOfSongs = {};
  this.lang = langFile[configFile.lang];
  this.listSongs = listSongs;

  //---- Song ----
  this.isplayedAtPosition = false;
  this.stopImmediately = false;
  this.isMovingForward = false;
  this.isSongPlaying = false;
  this.isNextAble = false;
  this.prevSongsToPlay = [];
  this.filter = [];
  this.oldFile = '';
  this.file = '';
  this.position = 0;
  this.duration = 0;
  this.source = null;
  this.playedFrom = from;

  //---- Elapsed time ----
  this.lastCurrentTime = 0;
  this.millisecond = 0;
  this.percent = 0;
  this.minute = 0;
  this.second = 0;
  this.lapse = 0;
  this.interval = null;
  this.time = {};

  /** --------------------------------------- Functions --------------------------------------- **/
  this.filters = function () {
    let f = null;
    let db = configFile.equalizer[configFile.equalizerConfig]
      .map(v => v === 0 ? 0 : (v === 12 ? 12 : (12 - (v / 10)).toFixed(1)));

    this.filter = hrz.map((v, i) =>
      (f = audioContext.createBiquadFilter(),
        f.type = 'peaking',
        f.frequency.value = v,
        f.Q.value = 0.3,
        f.gain.value = db[i], f)
    );
  };
  this.filters();

  // ELapse of time
  this.startTimer = function () {
    let self = this;
    const update = function () {
      if (++self.millisecond > 59) {
        self.millisecond = 0;
        if (++self.second > 59) {
          ++self.minute;
          self.second = 0;
        }

        $('#time-start').text(`${formatDecimals(self.minute)}:${formatDecimals(self.second)}`);
        $('#progress-bar').css(`width:${self.percent += self.lapse}%`);
      }
      self.interval = requestAnimationFrame(update);
    };
    self.interval = requestAnimationFrame(update);
  }

  // Clean the everything when the ended function is executed
  this.stopTimer = function (self) {
    if (!self.stopImmediately) {
      if (!self.isMovingForward) {
        if (self.playedFrom === 'album') $(`#al-${self.oldFile.position}`).css('color:var(--blackColor)');
        else $(`#${self.oldFile.position}`).child().each(v => $(v).css('color:var(--blackColor)'));

        self.isSongPlaying = false;
        self.isNextAble = true;
        self.millisecond = self.second = self.minute = self.percent = self.lapse = 0;

        cancelAnimationFrame(self.interval);

        if (self.isNextAble && !self.isMovingForward && !self.isplayedAtPosition) self.initSong();
      } else if (self.isMovingForward) {

        // It must be created a new AudioNode, because the stop function delete the node.
        self.setAudioBufferToPlay(self.poolOfSongs[self.oldFile.filename]);

        self.isMovingForward = false;
        self.isSongPlaying = true;
      }
    }
  };

  // Show the data of the selected song
  this.dataSong = function (file) {
    let self = this;
    $('#time-start').text('00:00');
    $('#progress-bar').css('width:0');
    $('#song-title').data({ position: self.file.position }).child().each(function (v) { $(v).text(self.file.title); });
    $('#artist').child().each(function (v) { $(v).text(self.file.artist); });
    $('#album').child().each(function (v) { $(v).text(self.file.album); });

    if (notification !== null) {
      notification.close();
      notification = null
    }

    notifi.body = `${nbspToSpace(self.file.artist)} from ${nbspToSpace(self.file.album)}`;
    notification = new Notification(nbspToSpace(self.file.title), notifi);

    // Set the name of the song in the top bar
    ipcRenderer.send('update-title', `${nbspToSpace(file.title)} - ${nbspToSpace(file.artist)} - Soube`);
  }

  this.setBufferInPool = function (filePath, buffer) {
    if (!this.poolOfSongs[filePath]) this.poolOfSongs[filePath] = buffer;
  };

  this.getFile = function () {
    return this.listSongs[
      this.isplayedAtPosition ? this.position :
        (configFile.shuffle ?
          Math.floor(Math.random() * this.listSongs.length) :
          (this.position === this.listSongs.length - 1 ? this.position = 0 : ++this.position)
        )];
  };

  // This function recive the buffer of the song to be played
  // Also start the song
  this.setAudioBufferToPlay = function (buffer) {
    let self = this;
    this.source = audioContext.createBufferSource();
    this.source.onended = () => self.stopTimer(self);
    this.source.buffer = buffer;

    // connect all the nodes
    this.source.connect(this.filter[0]);
    this.filter.reduce((p, c) => p.connect(c)).connect(audioContext.destination);
    this.startTimer();
    this.isMovingForward ? this.source.start(0, this.forward) : this.source.start(0);
    this.lastCurrentTime = audioContext.currentTime;
    if ($('#spinner').has('spinner-anim')) {
      $($('.grid-container').get(0)).rmAttr('style');
      $('#spinner').switchClass('spinner-anim', 'hide');
    }
  };

  // Get the buffer of the song
  this.getBuffer = function (_path, fnc) {
    // Read the file
    xhtr.open('GET', url.format({
      pathname: _path,
      protocol: 'file:'
    }), true);
    xhtr.responseType = 'arraybuffer';
    xhtr.onload = function () {
      audioContext.decodeAudioData(xhtr.response).then(
        buffer => fnc(buffer), reason => fnc(false)
      );
    };
    xhtr.send(null);
  };

  this.setSong = function (buffer) {
    this.setAudioBufferToPlay(buffer);

    // The buffer gives us the song's duration.
    // The duration is in seconds, therefore we need to convert it to minutes
    this.time = timeParse((this.duration = buffer.duration));
    this.lapse = 100 / this.duration;

    $('#time-end').text(`${formatDecimals(this.time.minute)}:${formatDecimals(this.time.second)}`);

    // Change the color the actual song
    if (this.playedFrom === 'album') $(`#al-${this.file.position}`).css('color:var(--pinkColor)');
    else $(`#${this.file.position}`).child().each(v => $(v).css('color:var(--pinkColor)'));

    this.isSongPlaying = true;
  }

  // Load the "possible" next song.
  // This is for a faster loading.
  // It doesn't work if you click on a song of the list
  // or by choosing one by the filtered song list using
  // the searching bar
  this.nextPossibleSong = function () {
    let self = this;
    self.isplayedAtPosition = false;
    self.position = self.oldFile.position;

    // Next (possible) song to play
    // if it is not saved into the buffer, we have to get it and save it
    self.file = self.getFile();
    if (!self.poolOfSongs[self.file.filename]) {
      self.getBuffer(self.file.filename, data => {
        if (!data) throw data;

        self.isNextAble = true;
        self.setBufferInPool(self.file.filename, data);
      });
    }
  };

  this.initSong = function () {
    let self = this;
    animPlayAndPause('play');

    $($('.grid-container').get(0)).css('-webkit-filter:blur(1px)');
    $('#spinner').switchClass('hide', 'spinner-anim');

    // Get the buffer of song if it is in the poolOfSongs
    // Note: The oldFile is an important variable, because is saved into
    // the prevSongsToPlay array, which has all the played songs.
    if (self.poolOfSongs[self.file.filename]) {
      // play the song and save it as an old song (oldFile)
      self.setSong(self.poolOfSongs[self.file.filename]);
      self.dataSong((self.oldFile = self.file));
      self.nextPossibleSong();
    } else {
      // Get the song to play
      self.file = self.getFile();
      self.getBuffer(self.file.filename, data => {
        if (!data) throw data;

        // Save the buffer
        self.setBufferInPool(self.file.filename, data);

        // Play the song and save it as old (oldFile)
        self.setSong(data);
        self.dataSong((self.oldFile = self.file));
        self.nextPossibleSong();
      });
    }
  };

  this.checkNextAndPrevSong = function () {
    if (!this.isSongPlaying && audioContext.state === 'suspended') audioContext.resume();

    if (this.source !== null) {
      this.source.stop(0);
      this.source = null;
    }

    this.isNextAble = false;
  };
};

Controls.prototype.playSongAtPosition = function (pos = -1) {
  if (this.source !== null) {
    this.source.stop(0);
    this.source = null;
  }

  if (this.oldFile !== '') this.prevSongsToPlay.push(this.oldFile);

  this.file = '';
  this.isplayedAtPosition = true;
  this.stopImmediately = false;
  this.position = pos;

  this.initSong();
};

Controls.prototype.updateCurrentTime = function () {
  const totalTime = Math.floor(audioContext.currentTime - this.lastCurrentTime);

  if (totalTime > seconds_u) {
    this.time = timeParse(totalTime);
    this.minute += this.time.minute;
    this.second += this.time.second;
    this.percent += this.lapse * Math.floor(audioContext.currentTime - this.lastCurrentTime);
  }
};

Controls.prototype.saveCurrentTime = function () {
  this.lastCurrentTime = audioContext.currentTime;
};

Controls.prototype.setFilterVal = function (a, b) {
  this.filter[a].gain.setValueAtTime(b, audioContext.currentTime);
};

Controls.prototype.stopSong = function () {
  this.stopImmediately = true;
  cancelAnimationFrame(this.interval);

  $('#time-start').text('00:00');
  $('#time-end').text('00:00');
  $('#progress-bar').css('width:0');
  $('#song-title').child().each(v => { $(v).text(''); });
  $('#artist').child().each(v => { $(v).text(''); });
  $('#album').child().each(v => { $(v).text(''); });
  if (this.oldFile.length)
    $(`#${this.oldFile.position}`).child().each(v => $(v).css('color:var(--blackColor)'));

  animPlayAndPause('pause');

  if (this.source !== null) {
    this.source.stop(0);
    this.source = null;
  }

  this.isplayedAtPosition = this.isMovingForward = this.isSongPlaying =
    this.isNextAble = false;

  this.duration = this.lastCurrentTime = this.millisecond = this.percent =
    this.minute = this.second = this.lapse = 0;
  this.time = {};
};

Controls.prototype.nextSong = function () {
  if (this.isNextAble) {
    // oldFile saved
    this.prevSongsToPlay.push(this.oldFile);

    this.checkNextAndPrevSong();
  }
};

Controls.prototype.prevSong = function () {
  if (this.prevSongsToPlay.length > 0 && this.isNextAble) {
    this.file = this.prevSongsToPlay.pop();
    this.position = this.file.position;

    this.checkNextAndPrevSong();
  }
};

Controls.prototype.playSong = function () {
  this.stopImmediately = false;
  if (!this.isSongPlaying && audioContext.state === 'running') { // Reproducción única
    this.position = Math.floor(Math.random() * this.listSongs.length);
    this.initSong();
  } else if (this.isSongPlaying && audioContext.state === 'running') { // Ya reproduciendo
    let self = this;
    audioContext.suspend().then(() => self.isSongPlaying = false);

    cancelAnimationFrame(this.interval);
    animPlayAndPause('pause');
  } else if (!this.isSongPlaying && audioContext.state === 'suspended') { // Pausado
    this.isSongPlaying = true;

    this.startTimer();
    audioContext.resume();
    animPlayAndPause('play');
  }
};

Controls.prototype.setSongs = function (_songs) {
  this.listSongs = _songs;
};

Controls.prototype.shuffle = function () {
  this.file = '';
  configFile.shuffle = !configFile.shuffle;
  $('#shuffle-icon').css(`fill:${configFile.shuffle ? '#FBFCFC' : '#f06292'}`);

  editFile('config', configFile);
};

Controls.prototype.moveForward = function (event, element) {
  this.isMovingForward = true;

  cancelAnimationFrame(this.interval);

  this.forward = this.duration * event.offsetX / element.clientWidth;
  this.time = timeParse(this.forward);

  // Calculate the new time
  this.minute = this.time.minute;
  this.second = this.time.second;
  this.millisecond = this.forward * 100;

  // Calculate the percent of the progress bar
  this.percent = this.forward * (100 / this.duration);
  this.source.stop(0);
};

module.exports = Controls;