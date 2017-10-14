/**
 * @module preferences/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 */

 /** -=================================== // ===================================- **/
const configurations = require('./configurations')
const about = require('./about')

module.exports = Object.freeze({
    configurations,
    about
})