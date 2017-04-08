/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
module.exports = (app) => {
  const configFile = require(`${app.getPath('userData')}/config.json`);

  const template = {
    es: [
      {
        label: 'Canciones',
        submenu: [
          {
            label: 'Agregar nueva carpeta',
            click(menuItem, browerWindow, event) {
              browerWindow.webContents.send('menu-add-folder');
            }
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
        label: 'Equalizador'
      },
      {
        label: 'Opciones',
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
            click(menuItem, browerWindow, event) {
              browerWindow.webContents.send('menu-add-folder');
            }
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
        label: 'Equalizer'
      },
      {
        label: 'Options',
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