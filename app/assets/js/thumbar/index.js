/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Functions --------------------------------- */
// Will create the thumbar with three buttons:
// Play/Pause, Prev, Next.
// [Windows only!]
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
