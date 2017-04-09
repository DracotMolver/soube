/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
const {
  configFile,
  langFile,
  editFile
} = require('./../../config').init();
require('./../../dom');

/* --------------------------------- Variables --------------------------------- */
//---- normals ----
let lang = langFile[configFile.lang];
let range = null;
let y = 0;
let db = 0;
let pos = 0;
let _db = 0;
let _pos = 0;

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
    mouseup: () => (
      _pos = pos,
      _db = db,
      range = null,
      y = db = pos = 0,
      fn(_pos, _db)
    )
  });
}

function onDragStart(el) {
  pos = $((range = el)).data('position');
};

function showEqualizer() {
  $($('.grid-container').get(0)).css('-webkit-filter:blur(1px)');
  $('#menu-equalizer').removeClass('hide');
  $('#_equalizerSetting').text(lang.config.equalizerSetting);

  
// EQ settings options
  Object.keys(configFile.equalizer).forEach(v => {
    $('#eq-buttons').insert(
      $('option').clone(true).val(v).text(v)
      .attr(configFile.equalizerConfig === v.toLowerCase() ? { selected: 'selected' } : '')
    );
  });
  // $('#eq-buttons').on({ change: setEQ });
}

module.exports = {
  showEqualizer
};