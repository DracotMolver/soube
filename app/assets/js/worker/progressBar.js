/**
 * @author Diego Molina Vera.
 * @copyright 2016 - 2017
 */
/* --------------------------------- Variables --------------------------------- */

let percent = 0;

/* --------------------------------- Functions --------------------------------- */
function start(lapse) {
    postMessage({
      w: `width:${percent += lapse}%`
    });
}

function stop() {
   percent = 0;
}

function moveFoward(d) {
  percent = d;
}

this.onmessage = e => {
  switch (e.data.action) {
    case 'start':
    case 'resume': start(e.data.per); break;
    case 'stop': stop(); break;
    case 'forward': moveFoward(e.data.d); break;
  }
};