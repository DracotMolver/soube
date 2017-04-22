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
  editFile,
  coloursFile
} = require(path.join(__dirname, '../../../', 'config')).init();
require(path.join(__dirname, '../../../', 'dom'));

/* --------------------------------- Variables --------------------------------- */
//---- normals ----
let lang = langFile[configFile.lang];
let option = CreateElement('option');

/** --------------------------------------- Functions --------------------------------------- **/
function displayOption() {
  switch (this.value) {
    case '1': showColoursTheme(); break;
    case '2':
    case '3':
  }
}

function showColoursTheme() {
  $('#theme-colours').removeClass('hide');
  $(`#${configFile.theme}`).text('<div id="checked-colour"></div>');
}

function choosenColor() {
  $(`#${configFile.theme}`).empty();
  configFile.theme = this.id;
  editFile('config', configFile);
  editFile(path.join(__dirname, '../../../../css', 'color.css'), coloursFile[this.id], true);
  $(`#${this.id}`).text('<div id="checked-colour"></div>');
}

function showConfigurations() {
  $($('.grid-container').get(0)).css('-webkit-filter:blur(1px)');
  $('#_configurations').text(lang.config.configurations);

  const fragment = document.createDocumentFragment();
  lang.config.configurationsOpt.forEach((o, i) =>
    fragment.appendChild(
      option.clone().val(i).text(o).get()
    )
  );

  $('#config-options')
    .append(fragment)
    .on({ click: displayOption });

  // Colours options
  const coloursNames = Object.keys(coloursFile);
  $('.colour-name')
    .each((v, i) => $(v).text(coloursNames[i]))

  $('.colour').on({ click: choosenColor });


  $($('.parent-container-config').get(2))
    .removeClass('hide')
    .child(0)
    .addClass('container-config-anim');
}

function close() {
  option = null;
}

module.exports = Object.freeze({
  showConfigurations,
  close
});