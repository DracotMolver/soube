/**
 * @author Diego Alberto Molina Vera
 */
/** --------------------------------------- Módulos --------------------------------------- **/
const metaData = require('musicmetadata');
const execFile = require('child_process').execFile;
const fs = require('fs');
const { shell, ipcRenderer, remote } = require('electron');
const { dialog } = remote;
const { getMetadata } = require('./listSongs');


/** --------------------------------------- Variables --------------------------------------- **/
// Archivos de configuraciones
let configFile = jread(CONFIG_FILE);
let lang = jread(LANG_FILE)[configFile.lang];

// Equalizador
let hrzGain = configFile.equalizer;
let range = null;
let plus = 0;
let pos = 0;
let db = 0;
let y = 0;

// Estilos de ondas
const rock = [70, 103, 105, 121, 145, 128, 125, 123, 122, 143, 163, 134, 135, 129, 139, 146, 144, 153, 152, 149, 124, 102, 103];
const electro = [99, 133, 102, 122, 100, 139, 125, 151, 158, 152, 124, 116, 116, 117, 147, 100, 139, 173, 112, 135, 165, 85, 121];
const acustic = [104, 124, 141, 0, 0, 104, 0, 104, 117, 0, 0, 0, 107, 104, 109, 123, 92, 107, 0, 154, 113, 84, 90];

/** --------------------------------------- Funciones --------------------------------------- **/
// Texto a modificar en la ventana de configuraciones
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
function animConfigPanel() {
  $('#config-container-options')
  .addClass('config-opt-anim')
  .on({
    'animationend': function () {
      $('#config-container-values').rmClass('hide');
      $(this).addClass('hide');
    }
  });
}

// Cambiar el idioma del reproductor
function onClickChangeLang() {
  $(`#${$(this).data('action', 'string')}`).rmClass('hide');

  animConfigPanel();
  // configuraciones > ventana de configuración actual
  $('#_titlesubconfig').text(` > ${lang.config.changeLanguage}`)

  $('.lang-option').on({
    'click': function () {
      configFile.lang = $(this).data('lang', 'string');
      configFile = jsave(CONFIG_FILE, configFile);
      window.location.reload(false);
      ipcRenderer.send('update-lang');
    }
  });
}

// Obtenemos las canciones - ruta
function saveSongList(parentFolder = '') {
  // Sobre-escribir el archivo listSong.json
  jsave(SONG_FILE, {});

  // Actualizar status de la carpeta
  $('#folder-status').child(0).text(parentFolder);
  configFile.musicFolder = parentFolder;
  configFile = jsave(CONFIG_FILE, configFile);

  // Leer el contenido de la carpeta padre
  // Desplegar loading
  getMetadata(parentFolder, () => { // Función inicial del proceso
    $('#loading').rmClass('hide');
    $($('.grid-container').get(0)).css('-webkit-filter:blur(2px);');
  }, _s => { // Función final del proceso
    ipcRenderer.send('display-list');

    // Ocultar loading
    $('#loading').addClass('hide');
    $($('.grid-container').get(0)).rmAttr('style');
  }, (count, maxLength) => { // Función iteradora
    // Pop-up con la cantidad de canciones cargandose
    $('#_loading-info').text(`${lang.config.loadingSongFolder} ${count} / ${maxLength}`);
  });
}

// Animación de los botones sobre el panel ecualizador
function onEqualizerPanel(e) {
  $('.eq-buttons').each((v, i) => { v.text(lang.eqStyles[i]); });

  $(`#${$(this).data('action', 'string')}`).rmClass('hide');

  animConfigPanel();
  $('#_titlesubconfig').text(` > ${lang.config.equalizerSetting}`);

  y = pos = plus = db = 0;
  range = null;

  const onDragMove = e => {
    if (range !== null) {
      y = parseInt(window.getComputedStyle(range).getPropertyValue('top'), 10);
      plus = (e.clientY - range.offsetTop) + y;

      if (plus > 0 && plus < 261) {
        db = plus;
        $(range).css(`top:${(e.clientY - range.offsetTop) + y}px;`);
      }

      ipcRenderer.send('equalizer-filter', [
        $(range).data('position', 'int'),
        plus !== 0 ? parseFloat((plus < 130 ? (121 - db) : - (db - 140)) / 10) : 0
      ]);
    }
  };

  const onDragStart = function onDragStart(e) {
    pos = $((range = this)).data('position', 'int');
  };

  const onDragEnd = () => {
    hrzGain[pos] = db;
    configFile.equalizer = hrzGain;
    configFile = jsave(CONFIG_FILE, configFile);
    range = null;
  };

  // Necesario para tener un drag más suave
  $(document).on({ 'mouseup': onDragEnd, 'mousemove': onDragMove });

  // El evento es solo registrado sobre los botones redondos
  // Setear la configuración establecida
  $('.range-circle').each((v, i) => {
    v.css(`top:${hrzGain[i] === 0 ? 130 : hrzGain[i]}px;`);
  }).on({
    'mousedown': onDragStart
  });
}

// Resetea el Equalizador
function resetEQ() {
  configFile.equalizer = configFile.equalizer.map(v => 0);
  configFile.equalizer.forEach((v, i) => {
    ipcRenderer.send('equalizer-filter', [i, v]);
  });
  configFile = jsave(CONFIG_FILE, configFile);
  $('.range-circle').css('top:130px;');
}

// EQUALIZADOR - ROCK
function othersEQ(hrz) {
  const circles = $('.range-circle');
  hrz.forEach((v, i) => {
    // Afectar al source node actual
    ipcRenderer.send('equalizer-filter', [i,
      v !== 0 ? parseFloat((v < 130 ? (121 - v) : - (v - 140)) / 10) : 0
    ]);

    $(circles.get(i)).css(`top:${v === 0 ? 130 : v}px;`);
  });
  
  // Guardar configuración
  configFile.equalizer = hrz;
  configFile = jsave(CONFIG_FILE, configFile);
}


// Mostrar los términos legales
function onClickLegal() {
  $(`#${$(this).data('action', 'string')}`).rmClass('hide');

  animConfigPanel();
  // configuraciones > ventana de configuración actual
  $('#_titlesubconfig').text(` > ${lang.config.legal}`);
}

/** --------------------------------------- Eventos --------------------------------------- **/
// Refrescar la ventana
$('#_titleconfig').on({ 'click': () => { window.location.reload(false); }});

// Cambiar idioma
$('#change-lang').on({ 'click': onClickChangeLang });

// Acción para agregar el listado de canciones
$('#add-songs').on({
  'click': () => {
    dialog.showOpenDialog({
      title: 'Add music folder',
      properties: ['openDirectory']
    }, parentFolder => {
      if (parentFolder !== undefined) saveSongList(parentFolder[0]);
    });
  }
});

// Mostrar ecualizador
$('#equalizer-panel').on({ 'click': onEqualizerPanel });

// Acciones predefinidas del ecualizador
$('.eq-buttons').on({
  'click': function () {
    switch($(this).data('eq', 'string')) {
      case 'reset': resetEQ(); break;
      case 'rock': othersEQ(rock); break;
      case 'electro': othersEQ(electro); break;
      case 'acustic': othersEQ(acustic); break;
    }
  }
});

// Abrir en el navegador por defecto sel SO
$(':a').on({
  'click': function (e) {
    e.preventDefault();
    shell.openExternal(this.href);
  }
});

// Mostrar legal
$('#terms').on({ 'click': onClickLegal });