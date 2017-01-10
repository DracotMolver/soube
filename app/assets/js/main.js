/**
 * @author Diego Alberto Molina Vera
 * 
 * All the constants variables are Uppercase.
 * Except some exported modules
 */
/** --------------------------------------- Módulos --------------------------------------- **/
// Electron módulos
const {
  ipcRenderer,
  remote
} = require('electron');

// Módulos propios
const PLAYER = require('./factory')('player');

const {
    configFile,
    langFile,
    listSongs
} = require('./config').init();
require('./dom');

// /** --------------------------------------- Variables --------------------------------------- **/
let lang = langFile[configFile.lang];
let clickedElement = null; // When you do click on the name of the song
let positionElement = null; // Where is the song that you clicked on.
let isSearchDisplayed = false; // Checks if it was launched the search input

const LAPSE_POPUP = 4500; // Duration of info popups
const LAPSE_SCROLLING = 60; // Lapse before do scrolling
const MAX_ELEMENTS = 20; // Max of elementos to display when is filtering a song [search input]
let totalResults = 0; // Amount of songs filtered
let searchValue = ''; // The input text to search for
// let tempSlide = 0;
// let countSlide = 0;
let fragmentSlide = null; // DocumentFragment() slide container
let fragmentItems = null; // DocumentFragment() button container
let slide = 0; // Amount of slides to make
let regex = null; // The name of the song to searching for as a regular expression
let list = null; // Filtered songs.
const BTN_FILTER_SONGS = [ // Elements to use as a items into the slide
    $('div').clone(false).addClass('grid-25 mobile-grid-25'),
    $('div').clone(false).addClass('search-results'),
    $('div').clone(false).addClass('results')
  ];
/** --------------------------------------- Funciones --------------------------------------- **/
// Una opción para los usuarios de linux.
// Verifica con github las versiones lanzadas.
// Así mostrar un mensaje que lleve a la página del sitio para descargarlo
function getActualVersion() {
  const xhtr = new XMLHttpRequest();
  xhtr.open('GET', 'https://api.github.com/repos/dracotmolver/soube/releases/latest', true);
  xhtr.onload = () => {
    const RESPONSE = JSON.parse(xhtr.response);
    if (remote.app.getVersion().toString() !== RESPONSE.tag_name) {
      $('#pop-up-container')
      .replaceClass('hide', '')
      .child(0)
      .addClass('pop-up-anim')
      .text(
        `<a href="http://soube.diegomolina.cl">${lang.alerts.newVersion}</a>`
      );

      // Para poder abrir en el navegador predeterminado y no dentro de la app
      $(':a').on({
        'click': function (e) {
          e.preventDefault();
          shell.openExternal(this.href);
        }
      });

      let tout = setTimeout(() => {
        $('#pop-up-container')
        .addClass('hide')
        .child(0)
        .replaceClass('pop-up-anim', 'hide');

        if (Object.keys(listSongs).length !== 0) checkNewSongs();

        clearTimeout(tout);
      }, LAPSE_POPUP);
    }
  };
  xhtr.send(null);
}

// Una de las funciones importantes.
// Se encarga de verificar si hay canciones que mostrar y arma lo
// necesario para que el reproductor funciones
function loadSongs() {
  // Activar shuffle
  if (configFile.shuffle) $('#shuffle-icon').css('fill:#FBFCFC');

  getActualVersion();

  if (Object.keys(listSongs).length === 0) {
    $('#list-songs').text(
      `<div id="init-message">${lang.alerts.welcome}</div>`
    );
  } else {
    // Desplegamos el listado de canciones con el estilo por defecto de tipo lista
    PLAYER.createView(PLAYER);
  }
}
loadSongs();

function hideSearchInputData() {
  $('#search-result').empty();
  $('#search-container').addClass('hide');
  $('#search-wrapper').replaceClass('search-wrapper-anim', '');
  $($('.grid-container').get(0)).rmAttr('style');
  $('#search').replaceClass('input-search-anim', '');
  isSearchDisplayed = false;
}


// This function is use into the function itemSlide
function selectedSong (position) {
  PLAYER.controls.playSongAtPosition(position);
  hideSearchInputData();
}

// This funciton will be executed every time the use hit down a keyword
// So, I carefully tried to do a clean, cheaper and faster code :).
function searchInputData(e) {
// //   countSlide = 0;
  searchValue = this.value;

  // Complete the text
  if (e.key === 'ArrowRight' && searchValue.length > 1)
    this.value = $('#search-result').text();

  if (e.key === 'Enter') selectedSong(list[0].position);

  regex = new RegExp(`^${searchValue.replace(/\s+/g, '&nbsp;')}`, 'ig');
  list = listSongs.filter(v => regex.test(v.title));

  // Shows possibles results
  if (searchValue.length > 0) {
    totalResults = list.length - 1;
    // tempSlide = 
    slide = totalResults > MAX_ELEMENTS ? Math.floor(totalResults / MAX_ELEMENTS) : 1;
    fragmentSlide = fragmentItems = document.createDocumentFragment();

    // Makes an slide with all the filtered coincidences
    const FILTERED_SONGS = totalResults < MAX_ELEMENTS ? totalResults : MAX_ELEMENTS;
    while (slide--) {
      for (var i = 0; i < FILTERED_SONGS; i++ , totalResults--) {
        fragmentItems.appendChild(
          BTN_FILTER_SONGS[0].clone(true)
          .insert(
            BTN_FILTER_SONGS[1].clone(true)
            .text(list[totalResults].title)
          )
          .data({ position: list[totalResults].position })
          .on({
            'click': function() {
              selectedSong($(this).data('position'));
            }
          }).get()
        );
      }

      // All the buttons into the slides
      fragmentSlide.appendChild(
        BTN_FILTER_SONGS[2].clone(true)
        .insert(fragmentItems)
        .css(`width:${document.body.clientWidth}px`).get()
      );
    }

// //     // Agregar paginación en caso de haber más de un slide
// //     // Como hay más canciones de las que se muestran
// //     // se crea la paginación y siempre empieza en el primer slide
// //     // generando así la animación de la flecha del lado derecho para avanzar al siguiente slide
// //     tempSlide > 1 ?
// //     $('#pagination').rmClass('hide').child(1).addClass('arrow-open-anim') :
// //     $('#pagination').addClass('hide');

    // Displays all the filtered songs
    $('#wrapper-results').empty().insert(fragmentSlide);
  // .css(`width:${tempSlide * document.body.clientWidth}px`);
  } else {
    // Clean if there's no coincidence
    $('#wrapper-results').empty();
    $('#pagination').addClass('hide');
  }

  // Shows the first coincidence to show as a ghost text
  $('#search-result').text(list.length > 0 && searchValue.length > 0 ? list[0].title : '');
}

// Chequear si hay nuevas canciones en el direcctorio para que sean agregadas
function checkNewSongs() {
  PLAYER.addSongFolder(configFile.musicFolder, () => {
    // Desplegar pop-up
    $('#pop-up-container')
    .replaceClass('hide', '')
    .child(0)
    .addClass('pop-up-anim');
  }, (i, maxlength) => {
    $('#pop-up').text(`${langFile[configFile.lang].alerts.newSongsFound}${i} / ${maxlength}`);

    if (i === maxlength) {
      // Ocultar pop-up
      $('#pop-up-container').addClass('hide').child(0).rmClass('pop-up-anim');
      window.location.reload(true);
    }
  });
}

function clickBtnControls() {
  // animación sobre los botones
  $(this).addClass('click-controls')
    .on({
      'animationend': function () {
        $(this).replaceClass('click-controls', '');
      }
  });

  if (listSongs.length !== 0) {
    switch (this.id) {
      case 'play-pause':
        if (PLAYER.controls.playSong() === 'resume') {
          // Send a message to the thumbar buttons [Windows]
  // //         if (process.platform) ipcRenderer.send('thumb-bar-update', 'pauseMomment');
        } else {
          // Send a message to the thumbar buttons [Windows]
  // //         if (process.platform) ipcRenderer.send('thumb-bar-update', 'playMomment');
        }
        break;
      case 'next': PLAYER.controls.nextSong(); break;
      case 'prev': PLAYER.controls.prevSong(); break;
      case 'shuffle': PLAYER.controls.shuffle() ;break;
    }
  } else {
      dialog.showMessageBox({
        type: 'info',
        buttons: ['Ok'],
        message: lang.alerts.error_002
      });
  }
}

/** --------------------------------------- Events --------------------------------------- **/
// Scrolling al dar click en la canción para buscarla en el listado total
$('#song-title').on({
  'click': function () {
    if (this.children[0].textContent.trim() !== '') {
      clickedElement = document.getElementById('list-songs');
      positionElement = document.getElementById($(this).data('position'));
      const ELEMENT = clickedElement.scrollTop;
      const TOP = positionElement.offsetTop;
      const TOPNAV = Math.round(document.getElementById('top-nav').offsetHeight);

      if (ELEMENT !== TOP - (TOPNAV + 100)) {
        clickedElement.scrollTop += (TOP - (TOPNAV + 100)) - ELEMENT;

        let time = setTimeout(() => {
          $(positionElement).addClass('anim-selected-song');
          $('.anim-selected-song').on({
            'animationend': function() {
              $(positionElement).replaceClass('anim-selected-song', '');
            }
          });
          clearTimeout(time);
        }, LAPSE_SCROLLING);
      }
    }
  }
});

// Abrir ventana de configuración
$('#config').on({ 'click': () => { ipcRenderer.send('show-config'); }});

// Action whe do click on over the buttons play, next, prev and shuffle
$('.btn-controls').on({ 'click': clickBtnControls });

// // // Adelantar o retroceder la canción usando la barra de progreso
// // $('#total-progress-bar').on({ 'click': function (e) { moveForward(e, this); }});

// // // Acción sobre los botones de paginación
// // $('.arrow').on({
// //   'click': function () {
// //     if (!$('#pagination').has('hide')) {
// //       if (this.id === 'right-arrow' && $(this).has('arrow-open-anim')) {
// //         if (countSlide < tempSlide) ++countSlide;
// //       } else if (this.id === 'left-arrow' && $(this).has('arrow-open-anim')) {
// //         if (countSlide < tempSlide && countSlide > 0) --countSlide;
// //       }

// //       if (countSlide === tempSlide - 1) $('#right-arrow').rmClass('arrow-open-anim');
// //       if (countSlide === 1) $('#left-arrow').addClass('arrow-open-anim');
// //       if (countSlide === 0) $('#left-arrow').rmClass('arrow-open-anim');
// //       if (countSlide === tempSlide - 2) $('#right-arrow').addClass('arrow-open-anim');
// //       if (countSlide < tempSlide && countSlide !== -1) {
// //         $('#wrapper-results').child()
// //         .css(`transform:translateX(${-1 * (countSlide * document.body.clientWidth)}px)`);
// //       }
// //     }
// //   }
// // });

/** --------------------------------------- Ipc Renderer --------------------------------------- **/
// // // Se detecta el cierre del inputsearch con la tecla Esc
// // ipcRenderer.on('close-search-song', () => { if (isSearchDisplayed) hideSearchInputData(); });

// Displays the search input [ctrl + F]
ipcRenderer.on('search-song', () => {
  if (!isSearchDisplayed) {
    $('#search-container').replaceClass('hide', '');
    $('#search-wrapper').addClass('search-wrapper-anim');
    $($('.grid-container').get(0)).css('-webkit-filter:blur(1px)');
    $('#wrapper-results').empty();
    $('#search').addClass('search-anim')
    .on({ 'keyup': searchInputData }).get().focus();
    isSearchDisplayed = true;
    countSlide = 0;
  }
});

// Send the values from the equalizer to the AudioContext [player/controls/index.js]
ipcRenderer.on('get-equalizer-filter', (e, a) => {
  PLAYER.controls.setFilterVal(...a);
});

// Makes the list of song when are exported from the config panel (adding the music folder)
ipcRenderer.on('order-display-list', () => {
  window.location.reload(false);
});

// Play or pause song [Ctrl + Up]
ipcRenderer.on('play-and-pause-song', PLAYER.controls.playSong);

// Next song [Ctrl + Right]
ipcRenderer.on('next-song', PLAYER.controls.nextSong);

// Prev song [Ctrl + Left]
ipcRenderer.on('prev-song', PLAYER.controls.prevSong);

// Shuffle [Ctrl + Down]
ipcRenderer.on('shuffle', PLAYER.controls.shuffle);

// // // ThumbarButtons [Windows]
// // ipcRenderer.on('thumbar-controls', (e, a) => {
// //   controlsActions(a);
// // });