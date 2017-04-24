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

/** --------------------------------------- Variables --------------------------------------- **/
let usingMediaControl = 'player';
let mediaControl = {};

module.exports = Object.freeze({
  setUsingMediaControl: media => usingMediaControl = media,
  getUsingMediaControl: () => usingMediaControl,
  setMediaControl: (option, value) => mediaControl[option] = value,
  getMediaControl: media => mediaControl[media],
  createAlbumView,
  createView,
  controls: require('./controls')
});