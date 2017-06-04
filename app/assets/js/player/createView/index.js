/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/** --------------------------------------- Modules --------------------------------------- **/
// ---- Electron ----
const path = require('path')

// ---- Own ----
const listSongs = require(path.join(__dirname, '../../', 'config')).init().listSongs
const $ = require(path.join(__dirname, '../../', 'dom'))

/** --------------------------------------- Functions --------------------------------------- **/
function playSong(_t, player) {
  player.getMediaControl(player.mediaControl).playSongAtPosition($(_t).data('position'))
}

// Will create and render the list of songs
function createView(player) {
  const f = document.createDocumentFragment()

  // Buil the basic structure of elements
  // The parent element must be created, because we will attach a function to it.
  // The rest of the elements, the childNodes, are not need to create them.
  // They can be just text.
  let parent = $(document.createElement('div'))
    .addClass('list-song-container').get()

  listSongs.forEach(function (v, i) {
    f.appendChild(
      $(parent.cloneNode(true))
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
        .on({
          click: function () {
            playSong(this, player)
          }
        }).get())
  })

  $('#list-songs').append(f)
}

function createAlbumView(player, folder, listSongs) {
  let div = $(document.createElement('div')).addClass('grid-100').get()
  const fragment = document.createDocumentFragment()

  // Name of the band or artist
  fragment.appendChild(
    $(div.cloneNode(true))
      .attr({ id: 'album-title-artist' })
      .text(listSongs[0].artist).get())

  // Name of the album
  fragment.appendChild(
    $(div.cloneNode(true))
      .attr({ id: 'album-title-album' })
      .text(path.basename(folder)).get())

  // List of songs
  listSongs.forEach(function (s, i) {
    fragment.appendChild(
      $(div.cloneNode(false))
        .addClass('album-title-song')
        .attr({ 'id': `al-${i}` })
        .data({
          position: i,
          artist: s.artist,
          title: s.title,
          album: s.album,
          url: s.filename
        })
        .on({
          click: function () {
            playSong(this, player)
          }
        }).text(s.title).get())
  })

  $('#album-to-play').empty().append(fragment)
}

module.exports = Object.freeze({
  createAlbumView,
  createView
})
