/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
module.exports = (app) => {
  const configFile = require(`${app.getPath('userData')}/config.json`);
  let menuLang = require('./../config/menuLang')[configFile.lang];

  return [
    {
      label: menuLang.songs.menu,
      submenu: [
        {
          label: menuLang.songs.submenu[0],
          click(menuItem, browserWindow, event) {
            browserWindow.webContents.send('menu-add-folder');
          }
        },
        {
          type: 'separator'
        },
        {
          label: menuLang.songs.submenu[1]
        },
        {
          label: menuLang.songs.submenu[2]
        }
      ]
    },
    {
      label: menuLang.eq.menu,
      click(menuItem, browserWindow, event) {
        browserWindow.webContents.send('menu-equalizer')
      }
    },
    {
      label: menuLang.options.menu,
      submenu: [
        {
          label: menuLang.options.submenu[0]
        },
        {
          label: menuLang.options.submenu[1]
        },
        {
          type: 'separator'
        },
        {
          label: menuLang.options.submenu[2]
        }
      ]
    }
  ];
};