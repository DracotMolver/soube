/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */

module.exports = (app) => {
  const configFile = require(`${app.getPath('userData')}/config.json`);
  const menuLang = require('./../config/menuLang')[configFile.lang];

  return [
    {
      label: menuLang.songs.menu, // Archivos
      submenu: [
        {
          label: menuLang.songs.submenu[0], // new folder
          click(menuItem, browserWindow, event) {
            browserWindow.webContents.send('menu-add-folder');
          }
        },
        {
          type: 'separator'
        },
        {
          label: menuLang.songs.submenu[1], // play an album from a folder
          click(menuItem, browserWindow, event) {
            browserWindow.webContents.send('menu-play-album');
          }
        },
        {
          label: menuLang.songs.submenu[2] // play a son - form a folder
        }
      ]
    },
    {
      label: menuLang.eq.menu, // Equalizer
      click(menuItem, browserWindow, event) {
        browserWindow.webContents.send('menu-equalizer');
      }
    },
    {
      label: menuLang.options.menu, // Preferences
      submenu: [
        {
          label: menuLang.options.submenu[0], // Configurations
          click(menuItem, browserWindow, event) {
            browserWindow.webContents.send('menu-configurations');
          }
        },
        {
          label: menuLang.options.submenu[1] // Documentation
        },
        {
          type: 'separator'
        },
        {
          label: menuLang.options.submenu[2], // About
          click(menuItem, browserWindow, event) {
            browserWindow.webContents.send('menu-about');
          }
        }
      ]
    }
  ];
};