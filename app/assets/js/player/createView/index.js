/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/** --------------------------------------- Modules --------------------------------------- **/
//---- Electron ----
const path = require('path');

//---- Own ----
const {
    listSongs
} = require(path.join(__dirname, '../../', 'config')).init();
require(path.join(__dirname, '../../' , 'dom'));

/** --------------------------------------- Functions --------------------------------------- **/
// Will create and render the list of songs
function createView(player) {
  const f = document.createDocumentFragment();

  // Buil the basic structure of elements
  // The parent element must be created, because we will attach a function to it.
  // The rest of the elements, the childNodes, are not need to create them.
  // They can be just text.
  let parent = CreateElement('div').addClass('list-song-container');

  const playSong = function () {
    player.controls.playSongAtPosition($(this).data('position'));
  };

  listSongs.forEach((v, i) => {
    f.appendChild(
      parent.clone()
        .attr({ id: i })
        .text(`
          <div class="grid-33 mobile-grid-33 song-info">${v.title}</div>
          <div class="grid-33 mobile-grid-33 song-info"><span class="miscelaneo">by</span>${v.artist}</div>
          <div class="grid-33 mobile-grid-33 song-info"><span class="miscelaneo">from</span>${v.album}</div>
        `)
        .data({
          position: i,
          artist: v.artist,
          title: v.title,
          album: v.album,
          url: v.filename
        })
        .on({ click: playSong }).get()
    );
  });

  $('#list-songs').append(f);
}

module.exports = createView;