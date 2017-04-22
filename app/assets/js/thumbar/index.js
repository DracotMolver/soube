/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Functions --------------------------------- */
// Will create the thumbar with three buttons:
// Play/Pause, Prev, Next.
// [Windows only!]
function makeThumBar(win, imgs = {}) {
  const play = {
    icon: imgs.play,
    tooltip: 'Play',
    click: () => {
      win.setThumbarButtons(pauseMomment);
      win.webContents.send('thumbar-controls', 'play-pause');
    }
  };

  const prev = {
    icon: imgs.prev,
    tooltip: 'Prev',
    click: () => win.webContents.send('thumbar-controls', 'prev')
  };

  const next = {
    icon: imgs.next,
    tooltip: 'Next',
    click: () => win.webContents.send('thumbar-controls', 'next')
  };

  const pause = {
    icon: imgs.pause,
    tooltip: 'Pause',
    click: () => {
      win.setThumbarButtons(playMomment);
      win.webContents.send('thumbar-controls', 'play-pause');
    }
  }

  return {
    playMomment: [prev, play, next],
    pauseMomment: [prev, pause, next]
  };
}

module.exports = Object.freeze({
  makeThumBar
});