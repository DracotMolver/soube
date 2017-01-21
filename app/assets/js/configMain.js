/**
 * @author Diego Alberto Molina Vera
 */
/* --------------------------------- Modules --------------------------------- */
// Electron modules
const {
  shell,
  ipcRenderer,
  remote
} = require('electron');

// Own modules
const factory = require('./factory');
const player = factory('player');
const EQ = factory('equilizer');

const {
  configFile,
  langFile,
  editFile
} = require('./config').init();
require('./dom');

/* --------------------------------- Variables --------------------------------- */
let lang = langFile[configFile.lang];
let eqHrz = [];
let newEQHrz = [];
let actualPanel = null;

/* --------------------------------- Functions --------------------------------- */

// Change the text in the config window
(function updateTextContet() {
  $('#_addsongfolder').text(lang.config.addSongFolder);
  $('#_statussongfolder').text(configFile.musicFolder === '' ? lang.config.statusSongFolder : configFile.musicFolder);
  $('#_changelanguage').text(lang.config.changeLanguage);
  $('#_statuslanguage').text(lang.config.statusLanguage);
  $('#_titleconfig').text(lang.config.titleConfig);
  $('#_equalizersetting').text(lang.config.equalizerSetting);
  $('#_legal').text(lang.config.legal);
  $('#_neweq').text(lang.config.newEQ);
})();

// Animation of the panel when select an option
function animConfigPanel(e, text) {
  actualPanel = $(`#${$(e).data('action')}`).replaceClass('hide', '');

  $('#config-container-options')
  .addClass('config-opt-anim')
  .on({
    'animationend': function () {
      $('#config-container-values').replaceClass('hide', '');
      $(this).addClass('hide');
    }
  });

  $('#_titlesubconfig').text(` > ${text}`);
}

// Change the lang of the music player
function onClickChangeLang() {
  animConfigPanel(this, lang.config.changeLanguage);

  $('.lang-option').on({
    'click': function () {
      configFile.lang = $(this).data('lang');
      editFile('config', configFile);
      window.location.reload(true);
    }
  });
}

// Get path song
function saveSongList(parentFolder = '') {
  configFile.musicFolder = parentFolder;
  editFile('listSong', {});
  editFile('config', configFile);

  $('#folder-status').child(0).text(parentFolder);

  // Shows loading
  // Read the content of the parent folder
  player.addSongFolder(parentFolder, () => {
    $('#loading').replaceClass('hide', '');
    $($('.grid-container').get(0))
    .css('-webkit-filter:blur(2px)');
  }, (i, maxLength) => { // Iterator function
    $('#_loading-info').text(`${lang.config.loadingSongFolder.replace('%d1', i).replace('%d2', maxLength)}`);

    if (i === maxLength) {
      // Ocultar loading
      $('#loading').addClass('hide');
      $($('.grid-container').get(0))
        .rmAttr('style');
      ipcRenderer.send('display-list');
    }
  });
}

// Animación de los botones sobre el panel ecualizador
// Hace uso de la clase equalizer y sus métodos
function onEqualizerPanel(e) {
  animConfigPanel(this, lang.config.equalizerSetting);

  EQ.onDragMove(data => {
      ipcRenderer.send('equalizer-filter', data);
  });

  EQ.onDragEnd((pos, db) => {
    newEQHrz[pos] = db;
  });

  // Set the EQ config choosen
  newEQHrz = eqHrz = configFile.equalizer[configFile.equalizerConfig];
  $('.range-circle').each((v, i) => {
    $(v).css(`top:${eqHrz[i] === 0 ? 130 : eqHrz[i]}px`);
  }).on({
    mousedown: function () {
      EQ.onDragStart(this);
    }
  });
}

// Options to config the EQ
function setEQ () {
  configFile.equalizerConfig = this.value;
  editFile('config', configFile);

  eqHrz = configFile.equalizer[configFile.equalizerConfig];
  $('.range-circle').each((v, i) => {
    $(v).css(`top:${eqHrz[i] === 0 ? 130 : eqHrz[i]}px`);

    ipcRenderer.send('equalizer-filter', [i,
      eqHrz[i] !== 0 ? parseFloat((eqHrz[i] < 130 ? 121 - eqHrz[i] : -eqHrz[i] + 140) / 10) : 0
    ]);
  });
}

/** --------------------------------------- Eventos --------------------------------------- **/
// Refresh the window
$('#_titleconfig').on({
  click: () => {
    if (actualPanel !== null) {
      actualPanel.addClass('hide');

      $('#config-container-options')
      .replaceClass('config-opt-anim', '')
      .replaceClass('hide', '');

      $('#config-container-values').addClass('hide');

      $('#_titlesubconfig').text('');
    }
  }
});

// Change the language
$('#change-lang').on({ click: onClickChangeLang });

// Action to add the songs
$('#add-songs').on({
  click: () => {
    remote.dialog.showOpenDialog({
      title: 'Add music folder',
      properties: ['openDirectory']
    }, parentFolder => {
      if (parentFolder !== undefined) saveSongList(parentFolder[0]);
    });
  }
});

// Shows EQ
$('#equalizer-panel').on({ click: onEqualizerPanel });

// EQ settings options
Object.keys(configFile.equalizer).forEach(v => {
  $('#eq-buttons').insert(
    $('option').clone(true).val(v).text(v)
    .attr(configFile.equalizerConfig === v.toLowerCase() ? { selected:'selected' } : '')
  );
});
$('#eq-buttons').on({ change: setEQ });

// Check if the person want to add a new EQ setting
$('#name-new-eq').on({
  keyup: function() {
    if (this.value.trim().length > 3) $('#_neweq').rmAttr('disabled');
    else $('#_neweq').attr({ disabled: 'disabled' });
  }
});

// Action to add a new EQ setting
$('#_neweq').on({
  click: function(e) {
    e.preventDefault();
    const eqStylesNames = Object.keys(configFile.equalizer);

    if(eqStylesNames.indexOf($('#name-new-eq').val()) === -1) {
      configFile.equalizer[$('#name-new-eq').val()] = newEQHrz;
      editFile('config', configFile);
    } else {
      console.log('El nombres ya exíste o no es un nombre válido');
    }
  }
});

// Open the default browser of the OS
$(':a').on({
  click: function (e) {
    e.preventDefault();
    shell.openExternal(this.href);
  }
});

// Show legal terms
$('#terms').on({
  click: function() {
    animConfigPanel(this, lang.config.legal);
  }
});