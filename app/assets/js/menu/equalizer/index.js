/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
// ---- Node ----
const path = require('path');

//---- Own ----
const {
  configFile,
  langFile,
  editFile
} = require(path.join(__dirname, '../../', 'config')).init();
require(path.join(__dirname, '../../', 'dom'));

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

let option = CreateElement('option');

/* --------------------------------- Functions --------------------------------- */
function getDB(value) {
  return value === 0 ? 0 : (value === 12 ? 12 : (12 - (value / 10)).toFixed(1));
}

// Options to config the EQ
function setEQ(value) {
  switch (value) {
    case 'new': console.log('add new'); break;
    case 'reset':
    case 'rock':
    case 'electro':
    case 'acustic':
      configFile.equalizerConfig = value;
      editFile('config', configFile);

      eqHrz = configFile.equalizer[value];
      for (var i = 0; i < 15; i++) {
        $(`#range-${i}`)
          .css(`top:${eqHrz[i] === 0 ? 120 : eqHrz[i]}px`)
          .data({ 'db': getDB(eqHrz[i]) });

        ipcRenderer.send('equalizer-filter', [i, getDB(eqHrz[i])]);
      }

      break;
  }
}

function showEqualizer() {
  $($('.grid-container').get(0)).css('-webkit-filter:blur(1px)');
  $('#_equalizerSetting').text(lang.config.equalizerSetting);
  // $('#_neweq').text(lang.config.newEQ);

  const fragment = document.createDocumentFragment();
  fragment.appendChild(
    option.clone()
      .text(lang.config.selectEQSeting).get()
  );

  // EQ select settings options
  Object.keys(configFile.equalizer).forEach(v =>
    fragment.appendChild(
      option.clone(true)
        .val(v)
        .text(v)
        .attr(
          configFile.equalizerConfig === v.toLowerCase() &&
          configFile.equalizerConfig !== 'reset' ? { selected: 'selected' } : ''
        ).get()
    )
  );

  // Option to add a new EQ setting
  fragment.appendChild(
    option.clone()
      .val('new')
      .text(lang.config.addNewEQSetting).get()
  );

  $('#eq-buttons')
    .empty()
    .append(fragment)
    .on({
      change: function () { setEQ(this.value); }
    });


  eqHrz = configFile.equalizer[configFile.equalizerConfig];

  for (var i = 0; i < 15; i++) {
    $(`#range-${i}`)
      .css(`top:${eqHrz[i] === 0 ? 120 : eqHrz[i]}px`)
      .data({ 'db': getDB(eqHrz[i]) });
  }

  $('.db-up-down').on({
    mousedown: function () {
      dbSetting(this, $(this).data('orientation'));
    },
    mouseup: () => clearTimeout(interval)
  })

  $($('.parent-container-config').get(1))
    .removeClass('hide')
    .child(0)
    .addClass('container-config-anim');
}

function dbSetting(el, orientation) {
  pos = $(el).data('position');
  percent = parseInt($(`#range-${pos}`).cssValue()[0].replace('px', ''));

  const animation = () => {
    if (percent) {
      $(`#range-${pos}`)
        .css(`top:${orientation === 'up' ? --percent : ++percent}px`)
        .data({ 'db': getDB(percent) });

      $(`#db-${pos}`).text(`${getDB(percent)} dB`)

      interval = setTimeout(animation, 120);
      ipcRenderer.send('equalizer-filter', [pos, getDB(percent)]);
    } else {
      clearTimeout(interval);
    }
  };
  interval = setTimeout(animation, 120);
}

function close() {
  clearInterval(interval);
  percent = eqHrz = pos = db = 0;
}

module.exports = {
  showEqualizer,
  close
};