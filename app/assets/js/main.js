/**
 * @author Diego Alberto Molina Vera
 */
/** --------------------------------------- Módulos --------------------------------------- **/
const {
  setFilterVal,
  moveForward,
  playSong,
  prevSong,
  nextSong,
  setSongs
} = require('./playFile');

const {
  createDefaultListView,
  setNextSongFunction,
  getMetadata
} = require('./listSongs');

const fs = require('fs');
const execFile = require('child_process').execFile;
const metaData = require('musicmetadata');
const { ipcRenderer, shell, remote } = require('electron');
const { dialog, app } = remote;
require('./commons');

/** --------------------------------------- Variables --------------------------------------- **/
let _songs = []; // Canciones cargadas

// Busqueda de canciones
let isSearchDisplayed = false; // Validar si se ha pulsado (ctrl | cmd) + f
let totalResults = 0;
let searchValue = '';
let fragContRes = null;
let textFound = '';
let tempSlide = 0;
let countSlide = 0;
let fragRes = null;
let slide = 0;
let _list = null; // Listado html de las canciones desplegadas en el front
const items = [
  $.clone('div', false).addClass('grid-25 mobile-grid-25'),
  $.clone('div', false).addClass('search-results'),
  $.clone('div', false).addClass('results')
];

// Archivos de configuraciones
let configFile = jread(CONFIG_FILE); // Configuraciones básicas
let lang = jread(LANG_FILE)[configFile.lang]; // Textos en idiomas

/** --------------------------------------- Funciones --------------------------------------- **/
// Una opción para los usuarios de linux.
// Verifica con github las versiones lanzadas.
// Así mostrar un mensaje que lleve a la página del sitio para descargarlo
function getActualVersion() {
  const xhtr = new XMLHttpRequest();
  xhtr.open('GET', 'https://api.github.com/repos/dracotmolver/soube/releases/latest', true);
  xhtr.onload = () => {
    const r = JSON.parse(xhtr.response);
    if (app.getVersion().toString() !== r.tag_name) {
      $('#pop-up-container').rmClass('hide')
      .child(0)
      .text(`<a href="http://soube.diegomolina.cl/views/download.html">${lang.alerts.newVersion}</a>`)
      .addClass('pop-up-anim');
      // Para poder abrir en el navegador predeterminado y no dentro de la app
      $(':a').on({
        'click': function (e) {
          e.preventDefault();
          shell.openExternal(this.href);
        }
      });

      const tout = setTimeout(() => {
        $('#pop-up-container').addClass('hide').child(0)
        .rmClass('pop-up-anim');
        clearTimeout(tout);
      }, 5000);
    }
  };
  xhtr.send(null);
}

// Una de las funciones importantes.
// Se encarga de verificar si hay canciones que mostrar y arma lo
// necesario para que el reproductor funciones
function loadSongs() {
  if (Object.keys(jread(SONG_FILE)).length === 0) {
    getActualVersion();
    $('#list-songs').text(`<div id="init-message">${lang.alerts.welcome}</div>`);
  } else {
    checkNewSongs();

    // Compartimos la función nextSong para el evento onclick en el listado de canciones
    setNextSongFunction(nextSong);

    // Desplegamos el listado de canciones con el estilo por defecto de tipo lista
    createDefaultListView();
  }
}

function hideSearchInputData() {
  $('#search-result').text('');
  $('#search-container').addClass('hide');
  $('#search-wrapper').rmClass('search-wrapper-anim');
  $($('.grid-container').get(0)).rmAttr('style');
  $('#search').rmClass('input-search-anim');
  isSearchDisplayed = false;
}

// Desplegar input search para buscar canciones
// Registrar un shorcut
function searchInputData(e) {
  countSlide = 0;
  searchValue = this.value;
  if (e.key === 'ArrowRight' && searchValue.length > 1)
    this.value = $('#search-result').text();

  if (e.key === 'Enter') {
    // Reproduce la canción buscada
    // Por defecto es la primera de las posibles coincidencias - texto fantasma
    nextSong(_list[0].position);

    hideSearchInputData();
  }

  _list = _songs.filter(v =>
    (new RegExp(`^${searchValue.replace(/\s/g, '&nbsp;')}`, 'ig')).test(v.title)
  );

  // Posibles resultados
  if (searchValue.length > 0) {
    totalResults = _list.length;
    tempSlide = slide = totalResults > 20 ? Math.floor(totalResults / 20) : 1;
    fragContRes = document.createDocumentFragment();
    fragRes = document.createDocumentFragment();

    // Genera slide con listado total de las coincidencias
    const x = (totalResults < 20 ? totalResults : 20);
    while (slide--) {
      for (var i = 0; i < x; i++ , totalResults--) {
        textFound = _list[totalResults - 1].title.replace(/\&nbsp;/g, ' ');

        // Se generan los items dentro del slide
        fragRes.appendChild(
          $.clone(items[0], true).insert(
            $.clone(items[1], true)
            .text(textFound.length > 25 ? `${textFound.slice(0, 25)}...` : textFound)
          )
          .data({ position: _list[totalResults - 1].position })
          .on({
            'click': function () {
              // Reproduce la canción buscada
              nextSong($(this).data('position', 'int'));

              hideSearchInputData();
            }
          })[0]
        );
      }

      // Agregar los items al slide
      fragContRes.appendChild(
        $.clone(items[2], true).insert(fragRes)
        .css(`width:${document.body.clientWidth}px;`)[0]
      );
    }

    // Agregar paginación en caso de haber más de un slide
    if (tempSlide > 1) {
      // Como hay más canciones de las que se muestran
      // se crea la paginación y siempre empieza en el primer slide
      // generando así la animación de la flecha del lado derecho para avanzar al siguiente slide
      $('#pagination').rmClass('hide').child(1).addClass('arrow-open-anim');
    } else {
      $('#pagination').addClass('hide');
    }

    // Despliega el total de canciones
    $('#wrapper-results').text('').insert(fragContRes)
    .css(`width:${tempSlide * document.body.clientWidth}px;`);
  } else {
    // Limpiar cuando no haya coincidencia
    $('#wrapper-results').text('');
    $('#pagination').addClass('hide');
  }

  // Mustra la primera coincidencia como opción a buscar
  $('#search-result').text(_list.length > 0 && searchValue.length > 0 ? _list[0].title : '');
}

/**
 * Chequear si hay nuevas canciones en el direcctorio para que sean agregadas
 */
function checkNewSongs() {
  getMetadata(jread(CONFIG_FILE).musicFolder, () => {
    // Desplegar pop-up
    $('#pop-up-container').rmClass('hide').child(0).addClass('pop-up-anim');
  }, _s => {
    // Pasamos el listado total de canciones a playFile.js
    setSongs((_songs = _s));

    // Ocultar pop-up
    $('#pop-up-container').addClass('hide').child(0).rmClass('pop-up-anim');
    getActualVersion();
  }, (count, maxLengt) => {
    // Pop-up con la cantidad de canciones cargandose
    $('#pop-up').text(`${lang.alerts.newSongsFound}${count} / ${maxLengt}`);
    if (count > maxLengt) window.location.reload(true);
  });
}

// Acciones sobre los botones del menú superior.
// play, prev, next & shuffles
function clickBtnControls() {
  $(this).addClass('click-controlls');

  if (_songs.length !== 0) {
    controlsActions(this.id);
  } else {
    dialog.showMessageBox({
      type: 'info',
      buttons: ['Ok'],
      message: lang.alerts.error_002
    });
  }
}

function controlsActions(action) {
  switch (action) {
    case 'play-pause':
      if (playSong() === 'resume') {
        // Send a message to the thumbar buttons [Windows]
        if (process.platform) ipcRenderer.send('thumb-bar-update', 'pauseMomment');
      } else {
        // Send a message to the thumbar buttons [Windows]
        if (process.platform) ipcRenderer.send('thumb-bar-update', 'playMomment');
      }
      break;
    case 'next': nextSong(); break;
    case 'prev': prevSong(); break;
    case 'shuffle':
      configFile.shuffle = !configFile.shuffle;
      $('#shuffle-icon').css(configFile.shuffle ? 'fill:#FBFCFC;' : 'fill:#f06292;');
      configFile = jsave(CONFIG_FILE, configFile);
      break;
  }
}

/** --------------------------------------- Eventos --------------------------------------- **/
// Scrolling al dar click en la canción para buscarla en el listado total
$('#song-title').on({
  'click': function () {
    if (this.children[0].textContent.trim() !== '') {
      const el = document.getElementById('list-songs').scrollTop
      const top = document.getElementById($(this).data('position', 'string')).offsetTop;
      const topNav = document.getElementById('top-nav').clientHeight;

      if (document.getElementById('list-songs').scrollTop !== (top - (topNav + 100))) {
        document.getElementById('list-songs').scrollTop += (top - (topNav + 100)) - el;

        const _time = setTimeout(() => {
          $(`#${$(this).data('position', 'string')}`).addClass('anim-selected-song');
          $('.anim-selected-song').on({
            'animationend': function() {
              $(this).rmClass('anim-selected-song');
            }
          });
          clearTimeout(_time);
        }, 100);
      }
    }
  }
});

// Activar shuffle
if (configFile.shuffle) $('#shuffle-icon').css('fill:#FBFCFC;');

// Abrir ventana de configuración
$('#config').on({ 'click': () => { ipcRenderer.send('show-config'); }});

// Vendría siendo el método init
fs.access(SONG_FILE, fs.F_OK | fs.R_OK, error => {
  if (error) {
    dialog.showErrorBox('Error [001]', `${lang.alerts.error_001}\n${error}`);
    return;
  } else {
    // Iniciar todo lo necesario para desplegar en la interfaz
    $('#list-songs').text('');
    loadSongs();
  }
});

$('.btn-controlls').on({
  'click': clickBtnControls,
  'animationend': function () {
    $(this).rmClass('click-controlls');
  }
});

// Adelantar o retroceder la canción usando la barra de progreso
$('#total-progress-bar').on({ 'click': function (e) { moveForward(e, this); }});

// Acción sobre los botones de paginación
$('.arrow').on({
  'click': function () {
    if (!$('#pagination').has('hide')) {
      if (this.id === 'right-arrow' && $(this).has('arrow-open-anim')) {
        if (countSlide < tempSlide) ++countSlide;
      } else if (this.id === 'left-arrow' && $(this).has('arrow-open-anim')) {
        if (countSlide < tempSlide && countSlide > 0) --countSlide;
      }

      if (countSlide === tempSlide - 1) $('#right-arrow').rmClass('arrow-open-anim');
      if (countSlide === 1) $('#left-arrow').addClass('arrow-open-anim');
      if (countSlide === 0) $('#left-arrow').rmClass('arrow-open-anim');
      if (countSlide === tempSlide - 2) $('#right-arrow').addClass('arrow-open-anim');
      if (countSlide < tempSlide && countSlide !== -1) {
        $('#wrapper-results').child()
        .css(`transform:translateX(${-1 * (countSlide * document.body.clientWidth)}px);`);
      }
    }
  }
});

/** --------------------------------------- Ipc Renderer --------------------------------------- **/
// Se detecta el cierre del inputsearch con la tecla Esc
ipcRenderer.on('close-search-song', () => { if (isSearchDisplayed) hideSearchInputData(); });

// Se detecta el registro de la combinación de teclas (ctrl|cmd) + F
// Para desplegar la busqueda de canciones
ipcRenderer.on('search-song', () => {
  if (!isSearchDisplayed) {
    $('#search-container').rmClass('hide');
    $('#search-wrapper').addClass('search-wrapper-anim');
    $($('.grid-container').get(0)).css('-webkit-filter:blur(2px);');
    $('#wrapper-results').text('');
    $('#search').addClass('search-anim')
    .on({ 'keyup': searchInputData }).val()[0].focus();
    isSearchDisplayed = true;
    countSlide = 0;
  }
})

// Configurar el equalizador.
ipcRenderer.on('get-equalizer-filter', (e, a) => { setFilterVal(...a); });

// Generar el listado de canciones cuando se han cargado desde el panel de configuraciones
// El llamdo se hace desde el main.js
ipcRenderer.on('order-display-list', () => {
  $('#list-songs').text('');
  loadSongs();
});

// Resetea el texto al idioma seleccionado
ipcRenderer.on('update-init-text', () => {
  window.location.reload(false);
});

// Pausar o empezar canción con la combinación Ctrl + Up
ipcRenderer.on('play-and-pause-song', () => { playSong(); });

// Siguiente canción con la combinación Ctrl + Right
ipcRenderer.on('next-song', () => { nextSong(); });

// Canción anterior con la combinación Ctrl + Left
ipcRenderer.on('prev-song', () => { prevSong(); });

// shuffle Ctrl + Down
ipcRenderer.on('shuffle', () => {
  configFile.shuffle = !configFile.shuffle;
  $('#shuffle-icon').css(configFile.shuffle ? 'fill:#FBFCFC;' : 'fill:#f06292;');
  configFile = jsave(CONFIG_FILE, configFile);
});

// ThumbarButtons [Windows]
ipcRenderer.on('thumbar-controls', (e, a) => {
  controlsActions(a);
});