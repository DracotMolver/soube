/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/** --------------------------------------- Modules --------------------------------------- **/
//---- Node ----
const path = require('path');

//---- Own ----
const {
  configFile,
  langFile,
  editFile
} = require(path.join(__dirname, '../../../', 'config')).init();
require(path.join(__dirname, '../../../', 'dom'));

/* --------------------------------- Variables --------------------------------- */
//---- normals ----
let lang = langFile[configFile.lang];

/** --------------------------------------- Functions --------------------------------------- **/
function showConfigurations() {
  $($('.grid-container').get(0)).css('-webkit-filter:blur(1px)');
  $('#_configurations').text(lang.config.configurations);



  $($('.parent-container-config').get(2))
    .removeClass('hide')
    .child(0)
    .addClass('container-config-anim');
}

function close() {

}

module.exports = Object.freeze({
  showConfigurations,
  close
});