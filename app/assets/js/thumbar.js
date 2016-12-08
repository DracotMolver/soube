/**
 * @author Diego Molina Vera.
 * 
 * Crea el thumbar para controlar las canciones
 */
let generalObject = {
  icon: null,
  tooltip: '',
  click: () => {}
};

function makeThumBar(win, imgs = {}) {
  let play = Object.create(generalObject);
  play.icon = imgs.play;
  play.tooltip = 'Play';
  play.click = () => {
    win.setThumbarButtons(pauseMomment);
    win.webContents.send('thumbar-controls', 'play-pause');
  };

  let prev = Object.create(generalObject);
  prev.icon = imgs.prev;
  prev.tooltip = 'Prev';
  prev.click = () => {
    win.webContents.send('thumbar-controls', 'prev');
  }

  let next = Object.create(generalObject);
  next.icon = imgs.next;
  next.tooltip = 'Next';
  next.click = () => {
    win.webContents.send('thumbar-controls', 'next');
  }

  let pause = Object.create(generalObject);
  pause.icon = imgs.pause
  pause.tooltip = 'Pause';
  puase.click = () => {
    win.setThumbarButtons(playMomment);
    win.webContents.send('thumbar-controls', 'play-pause');
  }

  const playMomment = [prev, play, next];
  const pauseMomment = [prev, pause, next];

  // Iniciación por defecto
  win.setThumbarButtons(playMomment);

  return { playMomment, pauseMomment };
}

module.exports = Object.freeze({
  makeThumBar
});