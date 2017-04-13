// /**
//  * @author Diego Alberto Molina Vera
//  * @copyright 2016 - 2017
//  */
// /* --------------------------------- Modules --------------------------------- */
// //---- electron ----
// const {
//   shell,
//   ipcRenderer,
//   remote
// } = require('electron');

// //---- own ----
// const factory = require('./factory');
// const player = factory('player');
// const EQ = factory('equilizer');
// const {
//   configFile,
//   langFile,
//   editFile
// } = require('./config').init();
// require('./dom');

// /* --------------------------------- Variables --------------------------------- */
// let lang = langFile[configFile.lang];
// let eqHrz = [];
// let newEQHrz = [];
// let actualPanel = null;

// /* --------------------------------- Functions --------------------------------- */
// // Change the text in the config window
// (function updateTextContet() {
//   $('#_addsongfolder').text(lang.config.addSongFolder);
//   $('#_statussongfolder').text(configFile.musicFolder === '' ? lang.config.statusSongFolder : configFile.musicFolder);
//   $('#_changelanguage').text(lang.config.changeLanguage);
//   $('#_statuslanguage').text(lang.config.statusLanguage);
//   $('#_titleconfig').text(lang.config.titleConfig);
//   $('#_equalizersetting').text(lang.config.equalizerSetting);
//   $('#_legal').text(lang.config.legal);
// })();

// // Animation of the panel when select an option
// function animConfigPanel(e, text) {
//   actualPanel = $(`#${$(e).data('action')}`).removeClass('hide');

//   $('#config-container-options')
//   .addClass('config-opt-anim')
//   .on({
//     'animationend': function () {
//       $('#config-container-values').removeClass('hide');
//       $(this).addClass('hide');
//     }
//   });

//   $('#_titlesubconfig').text(` > ${text}`);
// }

// // Change the lang of the music player
// function onClickChangeLang() {
//   animConfigPanel(this, lang.config.changeLanguage);

//   $('.lang-option').on({
//     'click': function () {
//       configFile.lang = $(this).data('lang');
//       editFile('config', configFile);
//       remote.getCurrentWindow().reload();
//     }
//   });
// }



// // Animation over the buttons in the EQ panel
// function onEqualizerPanel(e) {

//   EQ.onDragMove(data => {
//       ipcRenderer.send('equalizer-filter', data);
//   });

//   EQ.onDragEnd((pos, db) => {
//     newEQHrz[pos] = db;
//   });


// }



// /** --------------------------------------- Events --------------------------------------- **/
// // Refresh the window
// $('#_titleconfig').on({
//   click: () => {
//     if (actualPanel !== null) {
//       actualPanel.addClass('hide');

//       $('#config-container-options')
//       .removeClass('config-opt-anim')
//       .removeClass('hide');

//       $('#config-container-values').addClass('hide');
//       $('#_titlesubconfig').text('');
//     }
//   }
// });

// // Change the language
// $('#change-lang').on({ click: onClickChangeLang });


// // Check if the person want to add a new EQ setting
// $('#name-new-eq').on({
//   keyup: function() {
//     if (this.value.trim().length > 3) $('#_neweq').rmAttr('disabled');
//     else $('#_neweq').attr({ disabled: 'disabled' });
//   }
// });

// // Action to add a new EQ setting
// $('#_neweq').on({
//   click: function(e) {
//     e.preventDefault();
//     const eqStylesNames = Object.keys(configFile.equalizer);

//     if(eqStylesNames.indexOf($('#name-new-eq').val()) === -1) {
//       configFile.equalizer[$('#name-new-eq').val()] = newEQHrz;
//       editFile('config', configFile);
//     } else {
//       console.log('El nombres ya exíste o no es un nombre válido');
//     }
//   }
// });

// // Open the default browser of the OS
// $(':a').on({
//   click: function (e) {
//     e.preventDefault();
//     shell.openExternal(this.href);
//   }
// });

// // Show legal terms
// $('#terms').on({
//   click: function() {
//     animConfigPanel(this, lang.config.legal);
//   }
// });