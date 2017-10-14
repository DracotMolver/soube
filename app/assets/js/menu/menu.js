/**
 * @module menu/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 */

 /** -=================================== // ===================================- **/
const preferences = require('./preferences')
const equalizer = require('./equalizer')
const folders = require('./folders')

/** -=================================== Variables ===================================- **/
module.exports = Object.freeze({
    preferences,
    equalizer,
    folders
})
