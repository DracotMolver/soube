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
let isDragged = false;

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
})();

// Animación del panel cuando se selecciona una opción a configurar
function animConfigPanel(e, text) {
  $(`#${$(e).data('action')}`).replaceClass('hide', '');

  $('#config-container-options')
  .addClass('config-opt-anim')
  .on({
    'animationend': function () {
      $('#config-container-values').replaceClass('hide', '');
      $(this).addClass('hide');
    }
  });

  // configuraciones > ventana de configuración actual
  $('#_titlesubconfig').text(` > ${text}`);
}

// Cambiar el idioma del reproductor
// Nota: Esta función se mantiene acá por ser simple
function onClickChangeLang() {
  animConfigPanel(lang.config.changeLanguage);

  $('.lang-option').on({
    'click': function () {
      configFile.lang = $(this).data('lang');
      editFile('config', configFile);
      window.location.reload(false);
    }
  });
}

// Obtenemos las canciones - ruta
function saveSongList(parentFolder = '') {
  configFile.musicFolder = parentFolder;
  editFile('listSong', {});
  editFile('config', configFile);

  // Actualizar status de la carpeta
  $('#folder-status').child(0).text(parentFolder);

  // Desplegar loading
  // Leer el contenido de la carpeta padre
  player.addSongFolder(parentFolder, () => { // Función inicial del proceso
    $('#loading').replaceClass('hide', '');
    $($('.grid-container').get(0))
    .css('-webkit-filter:blur(2px)');
  }, (i, maxLength) => { // Función iteradora
    // Pop-up con la cantidad de canciones cargandose
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
  $('.eq-buttons').each((v, i) => {
    $(v).text(lang.eqStyles[i]);
  });

  animConfigPanel(this, lang.config.equalizerSetting);

  EQ.onDragMove(data => {
      ipcRenderer.send('equalizer-filter', data);
  });

  EQ.onDragEnd((pos, db) => {
    configFile.equalizer[pos] = db;
    if (isDragged) editFile('config', configFile);
  });

  // El evento es solo registrado sobre los botones redondos
  // Setear la configuración establecida
  $('.range-circle').each((v, i) => {
    $(v).css(`top:${configFile.equalizer[i] === 0 ? 130 : configFile.equalizer[i]}px`);
  }).on({
    mousedown: function () {
      isDragged = EQ.onDragStart(this);
    }
  });
}

// Resetea el Equalizador
function resetEQ() {
  configFile.equalizer = configFile.equalizer.fill(0)
  configFile.equalizer.forEach((v, i) => {
    ipcRenderer.send('equalizer-filter', [i, v]);
  });
  $('.range-circle').css('top:130px');
}

function othersEQ(hrz) {
  $('.range-circle').each((v, i) => {
    $(v).css(`top:${hrz[i] === 0 ? 130 : hrz[i]}px`);

    // Afectar al source node actual
    ipcRenderer.send('equalizer-filter', [i,
      hrz[i] !== 0 ? parseFloat((hrz[i] < 130 ? 121 - hrz[i] : -hrz[i] + 140) / 10) : 0
    ]);
  });

  configFile.equalizer = hrz;
  editFile('config', configFile);
}

/** --------------------------------------- Eventos --------------------------------------- **/
// Refrescar la ventana
$('#_titleconfig').on({
  click: () => {
    // Ya que se refresca el navegador, debemos guardar todo cambio
    editFile('config', configFile);
    window.location.reload(false);
  }
});

// Cambiar idioma
$('#change-lang').on({ click: onClickChangeLang });

// Acción para agregar el listado de canciones
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

// Mostrar ecualizador
$('#equalizer-panel').on({ click: onEqualizerPanel });

// Acciones predefinidas del ecualizador
$('.eq-buttons').on({
  click: function () {
    const EQ_DATA = $(this).data('eq');
    switch(EQ_DATA) {
      case 'rock':
      case 'electro':
      case 'acustic': othersEQ(EQ.styles[EQ_DATA]); break;
      case 'reset': resetEQ(); break;
    }
  }
});

// Abrir en el navegador por defecto sel SO
$(':a').on({
  click: function (e) {
    e.preventDefault();
    shell.openExternal(this.href);
  }
});

// Mostrar legal
$('#terms').on({
  click: function() {
    animConfigPanel(this, lang.config.legal);
  }
});