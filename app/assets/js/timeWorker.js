/**
 * @author Diego Molina Vera.
 * 
 * Calcula el tiempo que transcurre mientras se reproduce la canción
 */
let millisecond = 60;
let second = 0;
let minute = 0;
let percent = 0;

function start(lapse) {
  ++millisecond;
  if (millisecond > 59) { // Segundos
    ++second;
    millisecond = 0;
    if (second > 59) {
      ++minute;
      second = 0;
    }

    // Tiempo transcurrido
    postMessage({
      time: `${minute > 9 ? `${minute}` : `0${minute}`}${second > 9 ? `:${second}` : `:0${second}`}`,
      w: `width:${percent += lapse}%`
    });
  }
}

function stop() {
  millisecond = second = minute = percent = 0;
}

function moveFoward(d) {
  [minute, second, millisecond, percent] = d;
}

this.onmessage = e => {
  switch(e.data.action) {
    case 'start':
    case 'resume': start(e.data.per); break;
    case 'stop': stop(); break;
    case 'forward': moveFoward(e.data.d); break;
  }
};