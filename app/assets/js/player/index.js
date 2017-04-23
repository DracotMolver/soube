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

module.exports = Object.freeze({
  createAlbumView,
  createView,
  controls: require('./controls')
});