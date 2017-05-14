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
const $ = require(path.join(__dirname, '../../', 'dom'));

//---- Electronjs ----
const ipcRenderer = require('electron').ipcRenderer;

/* --------------------------------- Variables --------------------------------- */
//---- normals ----
let lang = langFile[configFile.lang];
let interval;
let option;

let settingName = '';
let percent = 0;
let eqHrz = 0;
let pos = 0;
let db = 0;

/* --------------------------------- Functions --------------------------------- */
function getDB(value) {
  return value ? (value === 12 ? 12 : (12 - (value / 10)).toFixed(1)) : 0;
}

function setBtnOptions(option) {
  if (['rock', 'acustic', 'electro', 'reset'].indexOf(option) === -1) {
    settingName = option;
    $('#modify-new-eq').removeClass('hide');
    $('#text-new-eq').text(option);
  } else {
    $('#modify-new-eq').addClass('hide');
    $('#add-new-eq').addClass('hide');
    $('#edit-new-eq').addClass('hide');
    $('#text-new-eq').text('');
  }
}

// Options to config the EQ
function setEQ() {
  settingName = this.value;
  switch (settingName) {
    case 'new':
      $('#add-new-eq').removeClass('hide');
      $('#edit-new-eq').addClass('hide');
      $('#modify-new-eq').addClass('hide');

      $('.warning').text('');
      for (var i = 0; i < 15; i++) {
        $(`#range-${i}`).css('top:120');

        $(`#db-${i}`).text('0 dB');
        ipcRenderer.send('equalizer-filter', [i, getDB(eqHrz[i])]);
      }
      break;
    default:
      if (settingName !== 'Select an style') {
        setBtnOptions(settingName);

        configFile.equalizerConfig = settingName;
        editFile('config', configFile);

        eqHrz = configFile.equalizer[settingName];
        for (var i = 0; i < 15; i++) {
          $(`#range-${i}`).css(`top:${eqHrz[i] ? eqHrz[i] : 120}px`);

          $(`#db-${i}`).text(`${getDB(eqHrz[i])} dB`);
          ipcRenderer.send('equalizer-filter', [i, getDB(eqHrz[i])]);
        }
      }
      break;
  }
}

function saveEQSetting() {
  let newSetting = [];
  let name = $('#name-new-eq').val().trim();

  $('.range-total-percent').each(function (v) {
    newSetting.push(parseInt($(v).cssValue()[0].replace('px', '')));
  });

  configFile.equalizer[name] = newSetting;
  editFile('config', configFile);

  $('#add-new-eq').addClass('hide');
  $('.warning').text(lang.config.newEQSettingSaved);

  option = document.createElement('option');
  $('#eq-buttons').append(
    $(option.cloneNode(true))
      .val(name)
      .text(name)
    , ['before', $('#eq-buttons').lastChild().get()]
  );

  setTimeout(function () {
    $('.warning').text('');
  }, 1600);
}

function updateEQSeeting() {

}

function showEqualizer() {
  $($('.grid-container').get(0)).css('-webkit-filter:blur(1px)');
  $('#_equalizerSetting').text(lang.config.equalizerSetting);

  $('#_neweq').text(lang.config.newEQ)
    .on({
      click: function () {
        saveEQSetting();
      }
    });

  $('#name-new-eq').on({
    keyup: function () {
      this.value.trim().length ?
        $('#_neweq').rmAttr('disabled') :
        $('#_neweq').attr({ disabled: true });
    }
  });

  const fragment = document.createDocumentFragment();
  option = document.createElement('option');

  fragment.appendChild(
    $(option.cloneNode(false)).text(lang.config.selectEQSetting).get()
  );

  // EQ select settings options
  Object.keys(configFile.equalizer).forEach(function (v) {
    fragment.appendChild(
      $(option.cloneNode(true))
        .val(v)
        .text(v)
        .attr(
        configFile.equalizerConfig === v ? { selected: 'selected' } : ''
        ).get()
    );

    if (configFile.equalizerConfig === v)
      setBtnOptions(v);
  });

  // Option to add a new EQ setting
  fragment.appendChild(
    $(option.cloneNode(false))
      .val('new')
      .text(lang.config.addNewEQSetting)
      .get()
  );

  $('#eq-buttons')
    .empty()
    .append(fragment)
    .on({ change: setEQ });

  eqHrz = configFile.equalizer[configFile.equalizerConfig];

  for (var i = 0; i < 15; i++) {
    $(`#range-${i}`).css(`top:${eqHrz[i] ? eqHrz[i] : 120}px`);

    $(`#db-${i}`).text(`${getDB(eqHrz[i])} dB`);
  }


  $('.db-up-down').on({
    mousedown: function () {
      dbSetting(this, $(this).data('orientation'));
    },
    mouseup: function () {
      clearTimeout(interval);
    },
    mouseleave: function () {
      clearTimeout(interval);
    }
  });

  // Delete and edit option over a new EQ setting
  $('#edit-name')
    .text(lang.config.newEQSettingEdit)
    .on({
      click: function () {
        settingName = $('#text-new-eq').text();
        $('#name-new-eq-edit').val(settingName);
        $('#modify-new-eq').addClass('hide');
        $('#edit-new-eq').removeClass('hide');
      }
    });

  $('#delete-name')
    .text(lang.config.newEQSettingDelete)
    .on({
      click: function () {
        if (delete configFile.equalizer[settingName]) {
          configFile.equalizerConfig = 'reset';

          $('.warning').text(lang.config.newEQSettingDeleted);
          $('#modify-new-eq').addClass('hide');
          $('#eq-buttons').rmChild(settingName);

          editFile('config', configFile);

          for (var i = 0; i < 15; i++) {
            $(`#range-${i}`).css('top:120px');

            $(`#db-${i}`).text('0 dB');
            ipcRenderer.send('equalizer-filter', [i, 0]);
          }

          setTimeout(function () {
            $('.warning').text('');
          }, 1600);
        }
      }
    });

  $('#_saveeq')
    .text(lang.config.newEQSettingUpdate)
    .on({ click: updateEQSeeting });

  $('#_canceleq')
    .text(lang.config.newEQSettingCancel)
    .on({
      click: function () {
        $('#modify-new-eq').removeClass('hide');
        $('#edit-new-eq').addClass('hide');
      }
    });

  $($('.parent-container-config').get(1))
    .removeClass('hide')
    .child(0)
    .addClass('container-config-anim');
}

function dbSetting(el, orientation) {
  pos = $(el).data('position');
  percent = parseInt($(`#range-${pos}`).cssValue()[0].replace('px', ''));

  const animation = function () {
    if (orientation === 'up' && percent)
      $(`#range-${pos}`).css(`top:${--percent}px`);
    else if (orientation === 'down' && percent)
      $(`#range-${pos}`).css(`top:${++percent}px`);

    if (percent) {
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
  ['#modify-new-eq', '#edit-new-eq', '#add-new-eq']
    .forEach(function (v) { $(v).addClass('hide'); });

  clearTimeout(interval);
  percent = eqHrz = pos = db = 0;
  settingName = '';
  option = null;
}

module.exports = Object.freeze({
  showEqualizer,
  close
});