/**
 * @author Diego Molina Vera.
 * 
 * Crea el thumbar para controlar las canciones
 */

function makeThumBar(win, imgs = {}) {
  let generalObject = {
    icon: null,
    tooltip: '',
    click: (fn) => { fn(); }
  };

  let play = Object.create(generalObject);
  play.icon = imgs.play;
  play.tooltip = 'Play';
  play.click(() => {
    win.setThumbarButtons(pauseMomment);
    win.webContents.send('thumbar-controls', 'play-pause');
  });

  let prev = Object.create(generalObject);
  prev.icon = imgs.prev;
  prev.tooltip = 'Prev';
  prev.click(() => {
    win.webContents.send('thumbar-controls', 'prev');
  });

  let next = Object.create(generalObject);
  next.icon = imgs.next;
  next.tooltip = 'Next';
  next.click(() => {
    win.webContents.send('thumbar-controls', 'next');
  });

  let pause = Object.create(generalObject);
  pause.icon = imgs.pause
  pause.tooltip = 'Pause';
  pause.click(() => {
    win.setThumbarButtons(playMomment);
    win.webContents.send('thumbar-controls', 'play-pause');
  });

  return {
    playMomment: [prev, play, next],
    pauseMomment: [prev, pause, next]
  };
}

module.exports = Object.freeze({
  makeThumBar
});