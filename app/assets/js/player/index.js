/**
 * @author Diego Alberto Molina Vera.
 * @copyright 2016 - 2017
 */
/** --------------------------------------- // --------------------------------------- **/
// Basically this will load the neede modules to display the songs
// and play them.
const {
  createAlbumView,
  createView
} = require('./createView');
const controls = require('./controls');

/** --------------------------------------- Variables --------------------------------------- **/
let usingMediaControl = 'player';
let mediaControl = {
  player: Object.create(controls),
  album: Object.create(controls)
};

module.exports = {
  setUsingMediaControl: media => usingMediaControl = media,
  mediaControl: usingMediaControl,
  getMediaControl: media => mediaControl[media],
  createAlbumView,
  createView,
};