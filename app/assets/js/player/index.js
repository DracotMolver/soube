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
const Controls = require('./controls');

/** --------------------------------------- Variables --------------------------------------- **/
let usingMediaControl = 'player';

let mediaControl = {
  player: new Controls('player'),
  album: new Controls('album')
};

module.exports = {
  setUsingMediaControl: media => usingMediaControl = media,
  mediaControl: usingMediaControl,
  getMediaControl: media => mediaControl[media],
  createAlbumView,
  createView,
};