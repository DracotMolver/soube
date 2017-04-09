/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
module.exports = (app) => {
  const configFile = require(`${app.getPath('userData')}/config.json`);

  const newFolder = browserWindow => browserWindow.webContents.send('menu-add-folder');
  const showEQ = browserWindow => browserWindow.webContents.send('menu-equalizer');

  const template = {
    es: [
      {
        label: 'Canciones',
        submenu: [
          {
            label: 'Agregar nueva carpeta',
            click(menuItem, browserWindow, event) { newFolder(browserWindow); }
          },
          {
            label: 'Cargar carpeta'
          },
          {
            type: 'separator'
          },
          {
            label: 'Cargar canción'
          }
        ]
      },
      {
        label: 'Equalizador',
        click(menuItem, browserWindow, event) { showEQ(browserWindow); }
      },
      {
        label: 'Preferencias',
        submenu: [
          {
            label: 'Cambiar idioma'
          },
          {
            label: 'Cambiar color del reproductor'
          },
          {
            type: 'separator'
          },
          {
            label: 'Acerca de Soube'
          }
        ]
      }
    ],
    us: [
      {
        label: 'Songs',
        submenu: [
          {
            label: 'Add new folder',
            click(menuItem, browserWindow, event) { newFolder(browserWindow); }
          },
          {
            label: 'Load folder'
          },
          {
            type: 'separator'
          },
          {
            label: 'Load song'
          }
        ]
      },
      {
        label: 'Equalizer',
        click(menuItem, browserWindow, event) { showEQ(browserWindow); }
      },
      {
        label: 'Preferences',
        submenu: [
          {
            label: 'Change idiom'
          },
          {
            label: 'Chagge player color'
          },
          {
            type: 'separator'
          },
          {
            label: 'About Soube'
          }
        ]
      }
    ]
  }


  return template[configFile.lang];
};