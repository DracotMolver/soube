/**
 * @author Diego Alberto Molina Vera
 */
/** --------------------------------------- Módulos --------------------------------------- **/
// // const {
// //   moveForward,
// //   playSong,
// //   prevSong,
// //   nextSong,
// //   setSongs
// // } = require('./playFile');

// // const {
// //   createDefaultListView,
// //   setNextSongFunction,
// //   getMetadata
// // } = require('./listSongs');

// Nodejs módulos
// const fs = require('fs');
// const execFile = require('child_process').execFile;

// const metaData = require('musicmetadata');
// Electron módulos
const {
  ipcRenderer,
//   shell,
  remote
} = require('electron');
const {
//   dialog,
  app
} = remote;

// Módulos propios
const factory = require('./factory');
const player = factory('player');

const {
    configFile,
    langFile,
    listSongs
} = require('./config').init();
require('./dom');

// /** --------------------------------------- Variables --------------------------------------- **/
// let _songs = []; // Canciones cargadas
let lang = langFile[configFile.lang];

// Busqueda de canciones
let clickedElement = null; // When you do click on the name of the song
let positionElement = null; // Where is the song that you clicked on.
// let isSearchDisplayed = false; // Validar si se ha pulsado (ctrl | cmd) + f
// let totalResults = 0;
// let searchValue = '';
// let fragContRes = null;
// let textFound = '';
// let tempSlide = 0;
// let countSlide = 0;
// let fragRes = null;
// let slide = 0;
// let regex = null;
// let _list = null; // Listado html de las canciones desplegadas en el front
// // const items = [
// //   $.create('div').addClass('grid-25 mobile-grid-25'),
// //   $.create('div').addClass('search-results'),
// //   $.create('div').addClass('results')
// // ];


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
      }, 4500);
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
    player.createView(player);
  }
}
loadSongs();

// // function hideSearchInputData() {
// //   $('#search-result').text('');
// //   $('#search-container').addClass('hide');
// //   $('#search-wrapper').rmClass('search-wrapper-anim');
// //   $($('.grid-container').get(0)).rmAttr('style');
// //   $('#search').rmClass('input-search-anim');
// //   isSearchDisplayed = false;
// // }

// // // Busca la canción - Pequeña función de los items del slide
// // // [searchInputData]
// // function playSelectedSong() {
// //   nextSong($(this).data('position', 'int'));

// //   hideSearchInputData();
// // }

// // // Desplegar input search para buscar canciones
// // // Registrar un shorcut
// // function searchInputData(e) {
// //   countSlide = 0;
// //   searchValue = this.value;
// //   if (e.key === 'ArrowRight' && searchValue.length > 1)
// //     this.value = $('#search-result').text();

// //   if (e.key === 'Enter') {
// //     // Reproduce la canción buscada
// //     // Por defecto es la primera de las posibles coincidencias - texto fantasma
// //     nextSong(_list[0].position);

// //     hideSearchInputData();
// //   }

// //   regex = new RegExp(`^${searchValue.replace(/\s/g, '&nbsp;')}`, 'ig');
// //   _list = _songs.filter(v => {
// //     if (regex.test(v.title)) {
// //       v.title = v.title.replace(/\&nbsp;/g, ' ');
// //       return v;
// //     }
// //   });

// //   // Posibles resultados
// //   if (searchValue.length > 0) {
// //     totalResults = _list.length;
// //     tempSlide = slide = totalResults > 20 ? Math.floor(totalResults / 20) : 1;
// //     fragContRes = document.createDocumentFragment();
// //     fragRes = document.createDocumentFragment();

// //     // Genera slide con listado total de las coincidencias
// //     const x = (totalResults < 20 ? totalResults : 20);
// //     while (slide--) {
// //       for (var i = 0; i < x; i++ , totalResults--) {
// //         textFound = _list[totalResults - 1].title;

// //         // Se generan los items dentro del slide
// //         fragRes.appendChild(
// //           $.clone(items[0], true).insert(
// //             $.clone(items[1], true)
// //             .text(textFound.length > 25 ? `${textFound.slice(0, 25)}...` : textFound)
// //           )
// //           .data({ position: _list[totalResults - 1].position })
// //           .on({
// //             'click': playSelectedSong
// //           }).get()
// //         );
// //       }

// //       // Agregar los items al slide
// //       fragContRes.appendChild(
// //         $.clone(items[2], true).insert(fragRes)
// //         .css(`width:${document.body.clientWidth}px`).get()
// //       );
// //     }

// //     // Agregar paginación en caso de haber más de un slide
// //     // Como hay más canciones de las que se muestran
// //     // se crea la paginación y siempre empieza en el primer slide
// //     // generando así la animación de la flecha del lado derecho para avanzar al siguiente slide
// //     tempSlide > 1 ?
// //     $('#pagination').rmClass('hide').child(1).addClass('arrow-open-anim') :
// //     $('#pagination').addClass('hide');

// //     // Despliega el total de canciones
// //     $('#wrapper-results').text('').insert(fragContRes)
// //     .css(`width:${tempSlide * document.body.clientWidth}px`);
// //   } else {
// //     // Limpiar cuando no haya coincidencia
// //     $('#wrapper-results').text('');
// //     $('#pagination').addClass('hide');
// //   }

// //   // Mustra la primera coincidencia como opción a buscar
// //   $('#search-result').text(_list.length > 0 && searchValue.length > 0 ? _list[0].title : '');
// // }

// Chequear si hay nuevas canciones en el direcctorio para que sean agregadas
function checkNewSongs() {
  player.addSongFolder(configFile.musicFolder, () => {
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
        if (player.controls.playSong() === 'resume') {
          // Send a message to the thumbar buttons [Windows]
  // //         if (process.platform) ipcRenderer.send('thumb-bar-update', 'pauseMomment');
        } else {
          // Send a message to the thumbar buttons [Windows]
  // //         if (process.platform) ipcRenderer.send('thumb-bar-update', 'playMomment');
        }
        break;
      case 'next': player.controls.nextSong(); break;
      case 'prev': player.controls.prevSong(); break;
      case 'shuffle': player.controls.shuffle() ;break;
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
      const el = clickedElement.scrollTop;
      const top = positionElement.offsetTop;
      const topNav = Math.round(document.getElementById('top-nav').offsetHeight);

      if (el !== top - (topNav + 100)) {
        clickedElement.scrollTop += (top - (topNav + 100)) - el;

        const _time = setTimeout(() => {
          $(positionElement).addClass('anim-selected-song');
          $('.anim-selected-song').on({
            'animationend': function() {
              $(positionElement).replaceClass('anim-selected-song', '');
            }
          });
          clearTimeout(_time);
        }, 60);
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

// // // Se detecta el registro de la combinación de teclas (ctrl|cmd) + F
// // // Para desplegar la busqueda de canciones
// // ipcRenderer.on('search-song', () => {
// //   if (!isSearchDisplayed) {
// //     $('#search-container').rmClass('hide');
// //     $('#search-wrapper').addClass('search-wrapper-anim');
// //     $($('.grid-container').get(0)).css('-webkit-filter:blur(2px)');
// //     $('#wrapper-results').text('');
// //     $('#search').addClass('search-anim')
// //     .on({ 'keyup': searchInputData }).get().focus();
// //     isSearchDisplayed = true;
// //     countSlide = 0;
// //   }
// // })

// Send the values from the equalizer to the AudioContext [player/controls/index.js]
ipcRenderer.on('get-equalizer-filter', (e, a) => {
  player.controls.setFilterVal(...a);
});

// Makes the list of song when are exported from the config panel (adding the music folder)
ipcRenderer.on('order-display-list', () => {
  window.location.reload(false);
});

// Play or pause song [Ctrl + Up]
ipcRenderer.on('play-and-pause-song', player.controls.playSong);

// Next song [Ctrl + Right]
ipcRenderer.on('next-song', player.controls.nextSong);

// Prev song [Ctrl + Left]
ipcRenderer.on('prev-song', player.controls.prevSong);

// Shuffle [Ctrl + Down]
ipcRenderer.on('shuffle', player.controls.shuffle);

// // // ThumbarButtons [Windows]
// // ipcRenderer.on('thumbar-controls', (e, a) => {
// //   controlsActions(a);
// // });