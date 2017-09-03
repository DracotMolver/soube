/**
 * @module thumbar/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * This class is only for Windows. It's creates the thumbar buttons, just to play
 * music as it was the music media player.
 */
/* --------------------------------- Functions --------------------------------- */
/**
 * [Windows] Will create the thumbar with three buttons:
 * - Play/Pause
 * - Prev
 * - Next
 * @param {BrowserWindow} win - BrowserWindows instance which will has the thumbar buttons
 * @param {any} [imgs] - Icons of the thumbar buttons. default an empty object "{}"
 * @return {object} - Returns an object with two arrays which constains the states of the buttons
 *                    [next|play|shuffle] - [next|pause|shuffle]
 */
module.exports = function makeThumBar(win, imgs = {}) {
    const play = {
        icon: imgs.play,
        tooltip: 'Play',
        click: function () {
            win.setThumbarButtons(pauseMomment)
            win.webContents.send('thumbar-controls', 'play-pause')
        }
    }

    const prev = {
        icon: imgs.prev,
        tooltip: 'Prev',
        click: function () { win.webContents.send('thumbar-controls', 'prev') }
    }

    const next = {
        icon: imgs.next,
        tooltip: 'Next',
        click: function () { win.webContents.send('thumbar-controls', 'next') }
    }

    const pause = {
        icon: imgs.pause,
        tooltip: 'Pause',
        click: function () {
            win.setThumbarButtons(playMomment)
            win.webContents.send('thumbar-controls', 'play-pause')
        }
    }

    const playMomment = [prev, play, next]
    const pauseMomment = [prev, pause, next]

    return {
        playMomment,
        pauseMomment
    }
}
