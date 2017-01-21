/**
 * @author Diego Molina Vera.
 * 
 * Crea el thumbar para controlar las canciones
 */

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

  const playMomment = [prev, play, next];
  const pauseMomment = [prev, pause, next];

  return {
    playMomment,
    pauseMomment
  };
}

module.exports = Object.freeze({
  makeThumBar
});