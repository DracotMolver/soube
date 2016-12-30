/**
 * @author Diego Alberto Molina Vera
 */
/** --------------------------------------- Módulos --------------------------------------- **/
// Módulos propios
const {
    listSongs
} = require('./../../config').init();
require('./../../dom');

/** --------------------------------------- Funciones --------------------------------------- **/
function createView(player) {
  // Contenedor que se reptite para el títutlo, artista y album
  const child = $('div').clone(false).addClass('grid-33 mobile-grid-33 song-info');
  const parentContainer = $('div').clone(false).addClass('list-song-container');
  const f = document.createDocumentFragment();
  let title = null;
  let album = null;
  let artist = null;

  listSongs.forEach((v, i) => {
    title = child.clone(true).text(v.title); // Título de la canción
    artist = child.clone(true).text(`<span class="miscelaneo">by</span>${v.artist}`); // Artista
    album = child.clone(true).text(`<span class="miscelaneo">from</span>${v.album}`); // Album

    f.appendChild(
      parentContainer.clone(true)
      .attr({id: i})
      .data({
        position: i,
        artist: v.artist,
        title: v.title,
        album: v.album,
        url: v.filename
      })
      .insert(title, artist, album)
      .on({ 'click': player.controls.playSongAtPosition })
      .get()
    );
  });

  $('#list-songs').insert(f);
}

module.exports = createView;