/**
 * @module assets/player/control/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 12016 - 2017
 * @license MIT License
 *
 * This class is one of the most important one.
 * Here all the data extracted is use to play the song.
 * Also here everything related to the song such as time, progress bar and data attributes
 * are executed here, and many other things that affect to the song.
 */
/* --------------------------------------- Modules ------------------------------------------- */
// ---- Node ----
const path = require('path')
// // const fs = require('fs')
// // const url = require('url')


// ---- Electron ----
const ipcRenderer = require('electron').ipcRenderer

// ---- Own ----
let {
    configFile,
    listSongs,
    langFile,
    editFile
} = require(path.join(__dirname, '../../', 'config')).init()
const $ = require(path.join(__dirname, '../../', 'dom'))

/* --------------------------------------- Variables ------------------------------------------- */
let notification = null
let notifi = {
    lang: 'US',
    tag: 'song',
    silent: false,
    icon: path.join(__dirname, '../../../', 'img', 'play.png')
}

const secondU = 60
const audioContext = new AudioContext()
let audioPlayer = document.getElementById('audio-player')
const hrz = [
    50, 100, 156, 220, 311, 440, 622, 880, 1250, 1750, 2500, 3500, 5000, 10000, 20000
]

// Cords to generate the animation.
// Google Chrome is throwing the next warning message:
// ** SVG's SMIL animations (<animate>, <set>, etc.) are deprecated and
// will be removed. Please use CSS animations or Web animations instead.**
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
}
let file
let obj
let forward

/* --------------------------------------- Class ------------------------------------------- */
let Controls = function () { }
Controls.prototype = {
    lang: langFile[configFile.lang],
    listSongs: listSongs,
    prevSongsToPlay: [],
    filter: [],
    millisecond: 0,
    position: 0,
    duration: 0,
    percent: 0,
    minute: 0,
    second: 0,
    lapse: 0,
    interval: null,
    isPlaying: false,
    isPaused: false,
    source: audioContext.createMediaElementSource(audioPlayer)
}

/* --------------------------------------- Functions ------------------------------------------- */
const _db = configFile.equalizer[configFile.equalizerConfig]
    .map(function (v) {
        return v ? (v === 12 ? 12 : (12 - (v / 10)).toFixed(1)) : 0
    })

obj = Controls.prototype
obj.filter = hrz.map(function (v, i) {
    return f = audioContext.createBiquadFilter(),
        f.type = 'peaking',
        f.frequency.value = v,
        f.Q.value = 0,
        f.gain.value = _db[i],
        f
})

// connect all the nodes
obj.source.connect(obj.filter[0])
obj.filter.reduce(function (p, c) {
    return p.connect(c)
}).connect(audioContext.destination)

audioPlayer.addEventListener('loadeddata', loadDuration.bind(obj))
audioPlayer.onplay = startTimer.bind(obj)
audioPlayer.onended = stopTimer.bind(obj)
audioPlayer.onpause = (function () {
    console.log("PAUSE")
    this.isPaused = true
    this.isPlaying = false
}).bind(obj)


function animPlayAndPause(animName) {
    if (process.platform === 'win32') {
        animName === 'play'
            ? ipcRenderer.send('thumb-bar-update', 'pauseMomment')
            : ipcRenderer.send('thumb-bar-update', 'playMomment')
    }

    $('.anim-play').each(function (v, i) {
        $(v).attr(animName === 'play'
            ? { from: anim.from[i], to: anim.to[i] }
            : { from: anim.to[i], to: anim.from[i] }
        ).get().beginElement()
    })
}

function formatDecimals(decimal) {
    return decimal > 9 ? `${decimal}` : `0${decimal}`
}

function timeParse(_time) {
    _time = (_time / secondU).toString()

    return {
        minute: parseInt(_time.slice(0, _time.lastIndexOf('.'))),
        second: Math.floor(_time.slice(_time.lastIndexOf('.')) * secondU)
    }
}

function nbspToSpace(value) {
    return value.replace(/&nbsp;/g, ' ')
}

function loadDuration() {
    this.duration = audioPlayer.duration
    this.time = timeParse(this.duration)
    this.lapse = 100 / (this.duration * 60)
    $('#time-end').text(`${formatDecimals(this.time.minute)}:${formatDecimals(this.time.second)}`)
}

function startTimer() {
    const update = function () {
        if (++this.millisecond > 59) {
            this.millisecond = 0
            if (++this.second > 59) {
                ++this.minute
                this.second = 0
            }
        }

        $('#time-start').text(`${formatDecimals(this.minute)}:${formatDecimals(this.second)}`)
        $('#progress-bar').css(`width:${this.percent += this.lapse}%`)

        this.interval = requestAnimationFrame(update.bind(this))
    }
    this.interval = requestAnimationFrame(update.bind(this))
}

function setFilterVal(a, b) {
    this.filter[a].gain.setValueAtTime(b, audioContext.currentTime)
}

function cleanData() {
    $('#time-start').text('00:00')
    $('#progress-bar').css('width:0')

    if (notification !== null)
        notification.close()

    if (this.playedFrom === 'album') {
        // $(`#al-${this.prevSongsToPlay[this.position ].position}`).css('color:var(--blackColor);text-decoration:none')
    } else {
        $(`#${this.prevSongsToPlay[this.prevSongsToPlay.length - 1].position}`)
            .child()
            .each(function (v) {
                $(v).css('color:var(--blackColor);text-decoration:none')
        })
    }
}

function stopTimer() {
    console.log("STOP")
    cleanData.call(this)
    this.millisecond = this.second = this.minute = this.percent = this.lapse = 0
    cancelAnimationFrame(this.interval)

    getPosition.call(this)
    initSong.call(this)
    dataSong.call(this)
}

function dataSong() {
    $('#song-title').data({ position: file.position })
    $('#song-title').child().each(function (v) { $(v).text(file.title) })
    $('#artist').child().each(function (v) { $(v).text(file.artist) })
    $('#album').child().each(function (v) { $(v).text(file.album) })


    notifi.body = `${nbspToSpace(file.artist)} from ${nbspToSpace(file.album)}`
    notification = new Notification(nbspToSpace(file.title), notifi)

    // Set the name of the song in the top bar
    ipcRenderer.send('update-title', `${nbspToSpace(file.title)} - ${nbspToSpace(file.artist)} - Soube`)

    // Change the color the actual song
    this.playedFrom === 'album'
        ? $(`#al-${file.position}`).css('color:var(--pinkColor);text-decoration:underline')
        : $(`#${file.position}`).child().each(function (v) {
            $(v).css('color:var(--pinkColor);text-decoration:underline')
        })
}

function getPosition() {
    this.position = (configFile.shuffle ? Math.floor(Math.random() * this.listSongs.length)
        : (this.position === this.listSongs.length - 1 ? 0 : ++this.position))
}

function setShuffle() {
    $('#shuffle-icon').css(
        `fill:${(configFile.shuffle = !configFile.shuffle) ? '#FBFCFC' : 'var(--lightPinkColor)'}`
    )

    editFile('config', configFile)
}

function promisePlay() {
    this.isPlaying = true
    this.isPaused = false

    if ($('#spinner').has('spinner-anim')) {
        $('#main-parent-container').rmAttr('style')
        $('#spinner').switchClass('spinner-anim', 'hide')
    }
}

function initSong() {
    animPlayAndPause('play')

    $('#main-parent-container').css('-webkit-filter:blur(1px)')
    $('#spinner').switchClass('hide', 'spinner-anim')

    file = this.listSongs[this.position]
    this.prevSongsToPlay.push(file)

    audioPlayer.src = file.filename

    audioPlayer.play().then(promisePlay.bind(this)).catch(function (e) { })
}

function playSongAtPosition(pos = -1) {
    $('#main-parent-container').css('-webkit-filter:blur(1px)')
    $('#spinner').switchClass('hide', 'spinner-anim')

    if (this.isPlaying || this.isPaused) {
        audioPlayer.pause()
        audioPlayer.src = ''
        audioPlayer.load()
        cleanData.call(this)
        this.millisecond = this.second = this.minute = this.percent = this.lapse = 0
        cancelAnimationFrame(this.interval)
    }

    this.position = pos
    initSong.call(this)
    dataSong.call(this)
}

// Controls.prototype.updateCurrentTime = function () {
//     if ((totalTime = Math.floor(audioContext.currentTime - this.lastCurrentTime)) > secondU) {
//         this.time = timeParse(totalTime)
//         this.minute += this.time.minute
//         this.second += this.time.second
//         this.percent += this.lapse * totalTime
//     }
// }

// Controls.prototype.saveCurrentTime = function () {
//     this.lastCurrentTime = audioContext.currentTime
// }


// Controls.prototype.stopSong = function () {
//     this.stopImmediately = true
//     cancelAnimationFrame(this.interval)

//     $('#time-start').text('00:00')
//     $('#time-end').text('00:00')
//     $('#progress-bar').css('width:0')
//     $('#song-title').child().each(function (v) { $(v).text('') })
//     $('#artist').child().each(function (v) { $(v).text('') })
//     $('#album').child().each(function (v) { $(v).text('') })

//     if (this.oldFile.length) {
//         $(`#${this.oldFile.position}`)
//             .child()
//             .each(function (v) {
//                 $(v).css('color:var(--blackColor)')
//             })
//     }

//     animPlayAndPause('pause')
//     if (this.source !== null) {
//         this.source.stop(0)
//         this.source = null
//     }

//     this.isplayedAtPosition = this.isMovingForward = this.isSongPlaying =
//         this.isNextAble = false

//     this.duration = this.lastCurrentTime = this.millisecond = this.percent =
//         this.minute = this.second = this.lapse = 0

//     this.time = {}
// }

// Controls.prototype.nextSong = function () {
//     // oldFile saved
//     if (this.isNextAble) {
//         this.prevSongsToPlay.push(this.oldFile)
//         this.checkNextAndPrevSong()
//     }
// }

// Controls.prototype.prevSong = function () {
//     if (this.prevSongsToPlay.length && this.isNextAble) {
//         this.position = (this.file = this.prevSongsToPlay.pop()).position
//         this.checkNextAndPrevSong()
//     }
// }

function playSong() {
    if (!this.isPlaying && !this.isPaused) { // First time
        getPosition.call(this)
        initSong.call(this)
        dataSong.call(this)
    } else if (this.isPlaying) {
        animPlayAndPause('pause')
        cancelAnimationFrame(this.interval)
        audioPlayer.pause()
    } else if (this.isPaused) {
        animPlayAndPause('play')
        audioPlayer.play().then(promisePlay.bind(this)).catch(function (e) { })
    }
}

obj.playSong = playSong.bind(obj)
obj.setShuffle = setShuffle.bind(obj)

// Controls.prototype.setSongs = function (_songs) {
//     this.listSongs = _songs
// }

function moveForward(event, element) {
    forward = this.duration * event.offsetX / element.clientWidth
    this.time = timeParse(forward)
    // Calculate the new time
    this.minute = this.time.minute
    this.second = this.time.second
    this.millisecond = forward * 100
    // Calculate the percent of the progress bar
    this.percent = forward * (100 / this.duration)
    audioPlayer.currentTime = forward
}

obj.moveForward = moveForward.bind(obj)

obj.playSongAtPosition = playSongAtPosition.bind(obj)
obj.setFilterVal = setFilterVal.bind(obj)

module.exports = Controls
