/**
 * @module assets/player/control/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 12016 - 2017
 * @license MIT License
 *
 * This module is one of the most important one. The module take in charge all the
 * related to the time lapse of the song, the total duration of it. Actions over:
 * the play button, prev button, next button and shuffle button.
 * of the song.
 */

/* -=================================== Modules ===================================- */
// ---- Node ----
const path = require('path')

// ---- Electron ----
const ipcRenderer = require('electron').ipcRenderer

// ---- Own ----
let {
    configFile,
    listSongs,
    langFile,
    editFile
} = require(path.join(__dirname, '../../', 'config')).init()
const { $ } = require(path.join(__dirname, '../../', 'dom'))

/* -=================================== Variables ===================================- */
'use strict'

let notification = null
let notifi = {
    lang: 'US',
    tag: 'song',
    silent: false,
    icon: path.join(__dirname, '../../../', 'img', 'play.png')
}

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
const _db = configFile.equalizer[configFile.equalizerConfig]
    .map(v => v ? (v === 12 ? 12 : (12 - (v / 10)).toFixed(1)) : 0)

/** -=================================== Class ===================================- **/
/**
 * All the functions and variables in the Controls class, are part of the
 * music player. Any other functions are off of it.
 */
Controls = {
    lang: langFile[configFile.lang],
    listSongs: listSongs,
    prevSongsToPlay: [],
    position: listSongs.length - 1,
    isPlaying: false,
    isPaused: false,
    isNext: false,
    playedFrom: '',
    source: audioContext.createMediaElementSource(audioPlayer),
    filter: hrz.map((v, i) =>
        (f = audioContext.createBiquadFilter(),
            f.type = 'peaking',
            f.frequency.value = v,
            f.gain.value = _db[i],
            f)
    ),
    /* -=================================== Functions ===================================- */
    /**
     * It will playe the song or pause it
     */
    playSong() {
        if (!this.isPlaying && !this.isPaused) { // First time
            this.getPosition()
        } else if (this.isPlaying) {
            animPlayAndPause('Set Pause')
            audioPlayer.pause()
        } else if (this.isPaused) {
            animPlayAndPause('play')
            audioPlayer.play().then(this.promisePlay.bind(this)).catch(e => { })
        }
    },
    /**
     * It will get the position of the song. There are three ways to get it:
     * - Clicking on a song
     * - Random position - (shuffle on)
     * - Next position after had stopped a song - (shuffle off)
     */
    getPosition() {
        this.position = (configFile.shuffle ? Math.floor(Math.random() * this.listSongs.length)
            : (this.position === this.listSongs.length - 1 ? 0 : ++this.position))
        this.initSong()
    },
    /**
     * It will start some stuffs before playing the song
     */
    initSong() {
        animPlayAndPause('play')

        $('#main-parent-container', { css: '-webkit-filter:blur(1px)' })
        $('#spinner', { switchClass: ['hide', 'spinner-anim'] })

        file = this.listSongs[this.position]
        this.prevSongsToPlay.push(file)

        audioPlayer.src = file.filename
        audioPlayer.play().then(this.promisePlay.bind(this)).catch(e => { })
        this.dataSong()
    },
    /**
     * Get and displays the data of the selected song by the "getPostion()" funciton
     */
    dataSong() {
        $('#song-title', {
            data: { position: file.position }
        })
        $('#song-title', {
            child() { },
            each(v) {
                $(v, { text: file.title })
            }
        })
        $('#artist', {
            child() { },
            each(v) {
                $(v, { text: file.artist })
            }
        })
        $('#album', {
            child() { },
            each(v) {
                $(v, { text: file.album })
            }
        })

        notifi.body = `${nbspToSpace(file.artist)} from ${nbspToSpace(file.album)}`
        notification = new Notification(nbspToSpace(file.title), notifi)

        // Set the name of the song in the top bar
        ipcRenderer.send('update-title', `${nbspToSpace(file.title)} - ${nbspToSpace(file.artist)} - Soube`)

        // Change the color the actual song
        this.playedFrom === 'album'
            ? $(`#al-${file.position}`, { css: 'color:var(--pinkColor);text-decoration:underline' })
            : $(`#${file.position}`, {
                child() { },
                each(v) {
                    $(v, { css: 'color:var(--pinkColor);text-decoration:underline' })
                }
            })
    },
    /**
     * IT will stop the song and get the next song
     */
    stopTimer() {
        this.stopSong()
        this.getPosition()
    },
    /**
     * It will pause thes song, just setting some boolean values
     */
    setPause() {
        this.isPaused = true
        this.isPlaying = false
    },
    /**
     * This is used on the play function, and that functino returns a promise.
     * It's part of the WEB API Adudio Element.
     * Like the puase function, it will only set some boolean values
     */
    promisePlay() {
        this.isPlaying = true
        this.isPaused = false
        this.isNext = true

        if ($('#spinner', { has: 'spinner-anim' })) {
            $('#main-parent-container', { rmAttr: 'style' })
            $('#spinner', { switchClass: ['spinner-anim', 'hide'] })
        }
    },
    /**
     * It will set the proper Db to the audiocontext, affecting to the song.
     * This is part of the Equalizer system.
     * 
     * @param {object} a - an object that contains the key and value (db)
     */
    setFilterVal(a) {
        a.length === 2
            ? this.filter[a[0]].gain.setValueAtTime(a[1], audioPlayer.currentTime)
            : a.forEach((function () {
                this.filter[e[0]].gain.setValueAtTime(e[1], audioPlayer.currentTime)
            }).bind(this))
    },
    /**
     * Enables or disables the shuffle option
     */
    setShuffle() {
        $('#shuffle-icon', {
            css:
            `fill:${(configFile.shuffle = !configFile.shuffle) ? '#FBFCFC' : 'var(--lightPinkColor)'}`
        })
        editFile('config', configFile)
    },
    /**
     * Get the position and play the selected song from the searching did it
     * 
     * @param {number} [pos=-1] - a position
     */
    playSongAtPosition(pos = -1) {
        $('#main-parent-container', { css: '-webkit-filter:blur(1px)' })
        $('#spinner', { switchClass: ['hide', 'spinner-anim'] })

        if (this.isPlaying || this.isPaused) {
            audioPlayer.pause()
            audioPlayer.src = ''
            audioPlayer.load()
            this.stopSong()
        }

        this.position = pos
        this.initSong()
    },
    /**
     * It will stop the song, cleaning all the values and setting all the
     * properties ready to play another song
     */
    stopSong() {
        if (notification) notification.close()

        if (this.prevSongsToPlay.length) {
            if (this.playedFrom === 'album') {
                $(`#al-${this.prevSongsToPlay[this.prevSongsToPlay.length - 1].position}`, {
                    css: 'color:var(--blackColor);text-decoration:none'
                })
            } else if (this.playedFrom === 'player') {
                $(`#${this.prevSongsToPlay[this.prevSongsToPlay.length - 1].position}`, {
                    child() { },
                    each(v) {
                        $(v, { css: 'color:var(--blackColor);text-decoration:none' })
                    }
                })
            }
        }

        $('#song-title', {
            child() { },
            each(v) {
                $(v, { text: '' })
            }
        })
        $('#artist', {
            child() { },
            each(v) {
                $(v, { text: '' })
            }
        })
        $('#album', {
            child() { },
            each(v) {
                $(v, { text: '' })
            }
        })

        animPlayAndPause('pause')
        audioPlayer.pause()
        audioPlayer.src = ''
        audioPlayer.load()

        this.isSongPlaying = this.isPaused = false
    },
    /**
     * Check if it is possible to play a next song
     */
    nextSong() {
        if (this.isNext) this.stopSong()

        this.getPosition()
    },
    /**
     * Check if it is possible to play a prev song
     */
    prevSong() {
        if (this.prevSongsToPlay.length && this.isNext) {
            this.prevSongsToPlay.pop()
            this.position = (this.file = this.prevSongsToPlay.pop()).position
            this.initSong()
        }
    },
    /**
     * Set if the music player is going to play the songs from the list of it
     * or from an album folder
     * 
     * @param {string} playedFrom - Possible values: album | player
     */
    setPlayedFrom(playedFrom) {
        this.playedFrom = playedFrom
    },
    /**
     * Set all the songs from the list of songs.
     * Used by the music player and the album view
     *
     * @param {object} _songs 
     */
    setSongs(_songs) {
        this.listSongs = _songs
    },
    /**
     * Clean all the data when pass form the album view to the music player and
     * vice versa
     */
    reset() {
        this.prevSongsToPlay = []
        this.position = listSongs.length - 1
        this.isPlaying = this.isPaused = this.isNext = false
        this.playedFrom = ''
    }
}

// connect all the nodes
Controls.source.connect(Controls.filter[0])
Controls.filter.reduce((p, c) => p.connect(c)).connect(audioContext.destination)

audioPlayer.onended = Controls.stopTimer.bind(Controls)
audioPlayer.onpause = Controls.setPause.bind(Controls)

/* -=================================== Functions ===================================- */
/**
 * Set the animation of the play button
 * 
 * @param {string} animName - play or pause
 */
function animPlayAndPause(animName) {
    if (process.platform === 'win32') {
        animName === 'play'
            ? ipcRenderer.send('thumb-bar-update', 'pauseMomment')
            : ipcRenderer.send('thumb-bar-update', 'playMomment')
    }

    $('.anim-play', {
        each(v, i) {
            $(v, {
                attr: animName === 'play'
                    ? { from: anim.from[i], to: anim.to[i] }
                    : { from: anim.to[i], to: anim.from[i] }
            }).beginElement()
        }
    })
}

/**
 * Replace the &nbsp; values by whitespace
 * 
 * @param {string} value
 * @returns {string} - the new parsed string
 */
function nbspToSpace(value) {
    return value.replace(/&nbsp;/g, ' ')
}

module.exports = Controls
