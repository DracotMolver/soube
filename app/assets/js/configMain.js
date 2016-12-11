/**
 * @author Diego Alberto Molina Vera
 */
/* --------------------------------- Módulos --------------------------------- */
// Electron módulos
const { shell, ipcRenderer, remote } = require('electron');
const { dialog } = remote;

// Node módulos
const execFile = require('child_process').execFile;
const fs = require('fs');

// Propios
const { getMetadata } = require('./player');
const {
  config,
  songsFile
} = require('./config');
require('./dom');

/* --------------------------------- Variables --------------------------------- */
// Equalizador
let hrzGain = config().equalizer;
let range = null;
let plus = 0;
let pos = 0;
let db = 0;
let y = 0;

// Estilos de ondas
const _otherQE = {
  rock: [70, 103, 105, 121, 145, 128, 125, 123, 122, 143, 163, 134, 135, 129, 139, 146, 144, 153, 152, 149, 124, 102, 103],
  electro: [99, 133, 102, 122, 100, 139, 125, 151, 158, 152, 124, 116, 116, 117, 147, 100, 139, 173, 112, 135, 165, 85, 121],
  acustic: [104, 124, 141, 0, 0, 104, 0, 104, 117, 0, 0, 0, 107, 104, 109, 123, 92, 107, 0, 154, 113, 84, 90]
};

let lang = config().langFile[config().lang];

/* --------------------------------- Funciones --------------------------------- */

// Texto a modificar en la ventana de configuraciones
(function updateTextContet() {
  $('#_addsongfolder').text(lang.config.addSongFolder);
  $('#_statussongfolder').text(config().musicFolder === '' ? lang.config.statusSongFolder : config().musicFolder);
  $('#_changelanguage').text(lang.config.changeLanguage);
  $('#_statuslanguage').text(lang.config.statusLanguage);
  $('#_titleconfig').text(lang.config.titleConfig);
  $('#_equalizersetting').text(lang.config.equalizerSetting);
  $('#_legal').text(lang.config.legal);
})();

// Animación del panel cuando se selecciona una opción a configurar
function animConfigPanel() {
  $('#config-container-options')
  .addClass('config-opt-anim')
  .on({
    'animationend': function () {
      $('#config-container-values').replaceClass('hide', '');
      $(this).addClass('hide');
    }
  });
}

// // Cambiar el idioma del reproductor
// function onClickChangeLang() {
//   $(`#${$(this).data('action', 'string')}`).rmClass('hide');

//   animConfigPanel();
//   // configuraciones > ventana de configuración actual
//   $('#_titlesubconfig').text(` > ${lang.config.changeLanguage}`)

//   $('.lang-option').on({
//     'click': function () {
//       configFile.lang = $(this).data('lang', 'string');
//       configFile = jsave(CONFIG_FILE, configFile);
//       ipcRenderer.send('update-lang');
//       window.location.reload(false);
//     }
//   });
// }

// // Obtenemos las canciones - ruta
// function saveSongList(parentFolder = '') {
//   // Sobre-escribir el archivo listSong.json
//   jsave(SONG_FILE, {});

//   // Actualizar status de la carpeta
//   $('#folder-status').child(0).text(parentFolder);
//   configFile.musicFolder = parentFolder;
//   configFile = jsave(CONFIG_FILE, configFile);

//   // Leer el contenido de la carpeta padre
//   // Desplegar loading
//   getMetadata(parentFolder, () => { // Función inicial del proceso
//     $('#loading').rmClass('hide');
//     $($('.grid-container').get(0)).css('-webkit-filter:blur(2px)');
//   }, _s => { // Función final del proceso
//     ipcRenderer.send('display-list');

//     // Ocultar loading
//     $('#loading').addClass('hide');
//     $($('.grid-container').get(0)).rmAttr('style');
//   }, (count, maxLength) => { // Función iteradora
//     // Pop-up con la cantidad de canciones cargandose
//     $('#_loading-info').text(`${lang.config.loadingSongFolder} ${count} / ${maxLength}`);
//   });
// }

// Animación de los botones sobre el panel ecualizador
function onEqualizerPanel(e) {
  $('.eq-buttons').each((v, i) => { $(v).text(lang.eqStyles[i]); });

  $(`#${$(this).data('action')}`).replaceClass('hide', '');

  animConfigPanel();
  $('#_titlesubconfig').text(` > ${lang.config.equalizerSetting}`);

  y = pos = /*plus = */ db = 0;
  range = null;

  const onDragMove = e => {
    if (range !== null) {
      y = parseInt(window.getComputedStyle(range).getPropertyValue('top'), 10);
      db = (e.clientY - range.offsetTop) + y;

      if (db > 0 && db < 261) {
        // db = plus;
        $(range).css(`top:${(e.clientY - range.offsetTop) + y}px`);
      }

      ipcRenderer.send('equalizer-filter', [
        $(range).data('position'),
        db !== 0 ? parseFloat((db < 130 ? 121 - db : - (db - 140)) / 10) : 0
      ]);
    }
  };

  const onDragStart = function onDragStart(e) {
    pos = $((range = this)).data('position');
  };

  const onDragEnd = () => {
    hrzGain[pos] = db;
    config().equalizer = hrzGain;
    range = null;
  };

  // Necesario para tener un drag más suave
  $(document).on({ 'mouseup': onDragEnd, 'mousemove': onDragMove });

  // El evento es solo registrado sobre los botones redondos
  // Setear la configuración establecida
  $('.range-circle').each((v, i) => {
    $(v).css(`top:${hrzGain[i] === 0 ? 130 : hrzGain[i]}px`);
  }).on({
    'mousedown': onDragStart
  });
}

// Resetea el Equalizador
function resetEQ() {
  configFile.equalizer = configFile.equalizer.fill(0);
  configFile.equalizer.forEach((v, i) => {
    ipcRenderer.send('equalizer-filter', [i, v]);
  });
  configFile = jsave(CONFIG_FILE, configFile);
  $('.range-circle').css('top:130px');
}

function othersEQ(hrz) {
  const circles = $('.range-circle');
  hrz.forEach((v, i) => {
    // Afectar al source node actual
  ipcRenderer.send('equalizer-filter', [i,
    v !== 0 ? parseFloat((v < 130 ? 121 - v : - (v - 140)) / 10) : 0
  ]);

  $(circles.get(i)).css(`top:${v === 0 ? 130 : v}px`);
});

// Guardar configuración
// configFile.equalizer = hrz;
// configFile = jsave(CONFIG_FILE, configFile);
}

// Mostrar los términos legales
function onClickLegal() {
  $(`#${$(this).data('action')}`).replaceClass('hide', '');

  animConfigPanel();
  // configuraciones > ventana de configuración actual
  $('#_titlesubconfig').text(` > ${lang.config.legal}`);
}

// /** --------------------------------------- Eventos --------------------------------------- **/
// // Refrescar la ventana
// $('#_titleconfig').on({ 'click': () => { window.location.reload(false); }});

// // Cambiar idioma
// $('#change-lang').on({ 'click': onClickChangeLang });

// // Acción para agregar el listado de canciones
// $('#add-songs').on({
//   'click': () => {
//     dialog.showOpenDialog({
//       title: 'Add music folder',
//       properties: ['openDirectory']
//     }, parentFolder => {
//       if (parentFolder !== undefined) saveSongList(parentFolder[0]);
//     });
//   }
// });

// Mostrar ecualizador
$('#equalizer-panel').on({ 'click': onEqualizerPanel });

// // Acciones predefinidas del ecualizador
// $('.eq-buttons').on({
//   'click': function () {
//     const eq = $(this).data('eq', 'string');
//     switch(eq) {
//       case 'rock':
//       case 'electro':
//       case 'acustic': othersEQ(_otherQE[eq]); break;
//       case 'reset': resetEQ(); break;
//     }
//   }
// });

// Abrir en el navegador por defecto sel SO
$(':a').on({
  'click': function (e) {
    e.preventDefault();
    shell.openExternal(this.href);
  }
});

// Mostrar legal
$('#terms').on({ 'click': onClickLegal });