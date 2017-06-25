/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/** --------------------------------------- Modules --------------------------------------- **/
// ---- Electron ----
const ipcRenderer = require('electron').ipcRenderer

// ---- Node ----
const path = require('path')

// ---- Own ----
const {
  coloursFile,
  configFile,
  langFile,
  editFile
} = require(path.join(__dirname, '../../../', 'config')).init()
const $ = require(path.join(__dirname, '../../../', 'dom'))

/* --------------------------------- Variables --------------------------------- */
let lang = langFile[configFile.lang]
let option = null

/** --------------------------------------- Functions --------------------------------------- **/
function displayOption() {
  $('#theme-colours').addClass('hide')
  $('#idiom').addClass('hide')
  $('#screen-size').addClass('hide')

  switch (this.value) {
    case '1': showColoursTheme(); break
    case '2': showLanguage(); break
    case '3': $('#screen-size').removeClass('hide'); break
  }
}

// Change the size of the screen
function enableScreenSize() {
  // enable the screen sizer
  if (this.checked) {
    $('#on-top').removeClass('hide')
    $('#sizer-container').removeClass('hide')
  } else {
    $('#on-top').addClass('hide')
    $('#sizer-container').addClass('hide')
  }
  // ipcRenderer.send('change-screen-size', screen.getPrimaryDisplay().workArea);
}


// Change the idiom of the app
function showLanguage() {
  $('#idiom').removeClass('hide')
  let i = ''
  switch (configFile.lang) {
    case 'es': i = 'Español<div class="checked-colour"></div>'; break
    case 'us': i = 'English<div class="checked-colour"></div>'; break
    case 'de': i = 'Deutsch<div class="checked-colour"></div>'; break
  }

  $(`#${configFile.lang}`).text(i).css('background:#fcfcfc')
}

function choosenIdiom() {
  configFile.lang = this.id
  editFile('config', configFile)

  let i = ''
  switch (configFile.lang) {
    case 'es': i = 'Español'; break
    case 'us': i = 'English'; break
    case 'de': i = 'Deutsch'; break
  }

  $(`#${configFile.lang}`).text(i).rmAttr('style')

  $(`#${this.id}`).text(`${i}<div class="checked-colour"></div>`)
    .css('background:#fcfcfc')

  setTimeout(function () {
    ipcRenderer.send('restart-app')
  }, 460)
}

// Change the colour of the app
function showColoursTheme() {
  $('#theme-colours').removeClass('hide')
  $(`#${configFile.theme}`).text('<div class="checked-colour"></div>')
}

function choosenColor() {
  $(`#${configFile.theme}`).empty()
  configFile.theme = this.id
  editFile('config', configFile)
  editFile(path.join(__dirname, '../../../../css', 'color.css'), coloursFile[this.id], true)
  $(`#${this.id}`).text('<div class="checked-colour"></div>')
}

function showConfigurations() {
  $('#main-parent-container').css('-webkit-filter:blur(1px)')
  $('#_configurations').text(lang.config.configurations)

  const fragment = document.createDocumentFragment()
  option = document.createElement('option')
  lang.config.configurationsOpt.forEach(function (o, i) {
    fragment.appendChild(
      $(option.cloneNode(false)).val(i).text(o).get()
    )
  })

  $('#config-options').empty().append(fragment)

  // Colours options
  const coloursNames = Object.keys(coloursFile);
  $('.colour-name').each(function (v, i) {
    $(v).text(coloursNames[i])
  })

  $($('.parent-container-config').get(2))
    .removeClass('hide')
    .child(0)
    .addClass('container-config-anim')
}

/** --------------------------------------- Functions --------------------------------------- **/
// Screen size
$('#enable-screen-size').on({ change: enableScreenSize })

// idiom
$('.idiom-item').on({ click: choosenIdiom })

$('.colour').on({ click: choosenColor })

$('#config-options').on({ click: displayOption })


module.exports = Object.freeze({
  showConfigurations,
  close: function() {
    option = null
  }
})
