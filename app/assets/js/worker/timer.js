/**
 * @author Diego Molina Vera.
 * @copyright 2016 - 2017
 */
/* --------------------------------- Variables --------------------------------- */
let millisecond = 60;
let percent = 0;
let second = 0;
let minute = 0;

/* --------------------------------- Functions --------------------------------- */
function formatDecimals(decimal) {
  return decimal > 9 ? `${decimal}` : `0${decimal}`;
}

function start(lapse) {
  if (++millisecond > 59) {
    millisecond = 0;
    if (++second > 59) {
      ++minute;
      second = 0;
    }

    postMessage({
      time: `${formatDecimals(minute)}:${formatDecimals(second)}`,
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
  switch (e.data.action) {
    case 'start':
    case 'resume': start(e.data.per); break;
    case 'stop': stop(); break;
    case 'forward': moveFoward(e.data.d); break;
  }
};