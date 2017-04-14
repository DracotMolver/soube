/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
//---- Own ----
const {
  configFile,
  langFile,
  editFile
} = require('./../../config').init();
require('./../../dom');

//---- Electronjs ----
const ipcRenderer = require('electron').ipcRenderer;

/* --------------------------------- Variables --------------------------------- */
//---- normals ----
let lang = langFile[configFile.lang];
let interval;
let percent = 0;
let eqHrz = 0;
let pos = 0;
let db = 0;

/* --------------------------------- Functions --------------------------------- */
// Options to config the EQ
function setEQ(value) {
  switch (value) {
    case 'new': console.log('add new'); break;
    case 'reset':
      $('.db-up').each((v, i) => {
        $(`#range-${$(v).data('position')}`)
          .css(`top:120px`)
          .data({ 'db': 0 });
      });
      configFile.equalizerConfig = value;
      editFile('config', configFile);

      break;
    case 'rock':
    case 'electro':
    case 'acustic':
      configFile.equalizerConfig = value;
      editFile('config', configFile);

      eqHrz = configFile.equalizer[configFile.equalizerConfig];
      $('.db-up').each((v, i) => {
        $(`#range-${$(v).data('position')}`)
          .css(`top:${eqHrz[i]}px`)
          .data({ 'db': (12 - (eqHrz[i] / 10)).toFixed(1) });

        ipcRenderer.send('equalizer-filter', [i, (12 - (eqHrz[i] / 10)).toFixed(1)]);
      });

      break;
  }
}

function showEqualizer() {
  $($('.grid-container').get(0)).css('-webkit-filter:blur(1px)');
  $('#_equalizerSetting').text(lang.config.equalizerSetting);
  // $('#_neweq').text(lang.config.newEQ);

  const fragment = document.createDocumentFragment();
  fragment.appendChild(
    $('option')
      .clone(true)
      .text(lang.config.selectEQSeting)
      .get()
  );

  // EQ select settings options
  Object.keys(configFile.equalizer).forEach(v => {
    fragment.appendChild(
      $('option')
        .clone(true)
        .val(v)
        .text(v)
        .attr(
          configFile.equalizerConfig === v.toLowerCase() &&
          configFile.equalizerConfig !== 'reset' ? { selected: 'selected' } : ''
        ).get()
    )
  });

  // Option to add a new EQ setting
  fragment.appendChild(
    $('option')
      .clone(true)
      .val('new')
      .text(lang.config.addNewEQSetting)
      .get()
  );

  $('#eq-buttons')
    .insert(fragment)
    .on({
      change: function () { setEQ(this.value); }
    });

  $($('.parent-container-config').get(1))
    .removeClass('hide')
    .child(0)
    .addClass('container-config-anim');

  setEQ(configFile.equalizerConfig);
  eqHrz = configFile.equalizer[configFile.equalizerConfig];
  $('.db-up').on({
    mousedown: function () {
      dbSetting(this, true);
    },
    mouseup: () => clearTimeout(interval)
  });

  $('.db-down').on({
    mousedown: function () {
      dbSetting(this, false);
    },
    mouseup: () => clearTimeout(interval)
  });
}

function dbSetting(el, orientation) {
  pos = $(el).data('position');
  percent = parseInt($(`#range-${pos}`).cssValue()[0].replace('px', ''));

  const animation = () => {
    if (percent) {
      $(`#range-${pos}`)
        .css(`top:${orientation ? --percent : ++percent}px`)
        .data({ 'db': (12 - (percent / 10)).toFixed(1) });
      ipcRenderer.send('equalizer-filter', [pos, (12 - (percent / 10)).toFixed(1)]);

      interval = setTimeout(animation, 100);
    } else {
      clearTimeout(interval);
    }
  };
  interval = setTimeout(animation, 100);
}

function close() {
  clearInterval(interval);
  percent = eqHrz = pos = db = 0;
}

module.exports = {
  showEqualizer,
  close
};