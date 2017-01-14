/**
 * @author Diego Alberto Molina Vera
 */
/* --------------------------------- Modules --------------------------------- */
require('./../../dom');
//---- normals ----
let range = null;
let y = 0;
let db = 0;
let pos = 0;
let _db = 0;
let _pos = 0;

//---- constants ----
const styles = {
  rock: [70, 103, 105, 121, 145, 128, 125, 123, 122, 143, 163, 134, 135, 129, 139, 146, 144, 153, 152, 149, 124, 102, 103],
  electro: [99, 133, 102, 122, 100, 139, 125, 151, 158, 152, 124, 116, 116, 117, 147, 100, 139, 173, 112, 135, 165, 85, 121],
  acustic: [104, 124, 141, 0, 0, 104, 0, 104, 117, 0, 0, 0, 107, 104, 109, 123, 92, 107, 0, 154, 113, 84, 90]
};

function onDragMove(fn) {
  $(document).on({
    mousemove: e => {
      if (range !== null) {
        y = parseInt(window.getComputedStyle(range).getPropertyValue('top'));
        db = (e.clientY - range.offsetTop) + y;

        if (db > 0 && db < 261) $(range).css(`top:${db}px`);

        return fn([
          $(range).data('position'),
          db !== 0 ? parseFloat((db < 130 ? 121 - db : -db + 140) / 10) : 0
        ]);
      }
    }
  });
};

function onDragEnd(fn) {
  $(document).on({
    mouseup: () => {
      _pos = pos
      _db = db;
      range = null;
      y = db = pos = 0;
      return fn(_pos, _db);
    }
  });
}

function onDragStart(el) {
  pos = $((range = el)).data('position');
  return true;
};

module.exports = {
  onDragMove,
  onDragStart,
  onDragEnd,
  styles
};