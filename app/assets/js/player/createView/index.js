/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/** --------------------------------------- Modules --------------------------------------- **/
// Own modules
const {
    listSongs
} = require('./../../config').init();
require('./../../dom');

/** --------------------------------------- Functions --------------------------------------- **/
function createView(player) {
  const child = $('div').clone(true).addClass('grid-33 mobile-grid-33 song-info');
  const parentContainer = $('div').clone(true).addClass('list-song-container');
  const f = document.createDocumentFragment();
  let title = null;
  let album = null;
  let artist = null;

  listSongs.forEach((v, i) => {
    title = child.clone(true).text(v.title);
    artist = child.clone(true).text(`<span class="miscelaneo">by</span>${v.artist}`);
    album = child.clone(true).text(`<span class="miscelaneo">from</span>${v.album}`);

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
      .on({
        click: function() {
          player.controls.playSongAtPosition($(this).data('position'));
        }
      }).get()
    );
  });

  $('#list-songs').insert(f);
}

module.exports = createView;