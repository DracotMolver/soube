/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
process.env.NODE_ENV = 'production';

/* --------------------------------- Modules --------------------------------- */
//---- Electron ----
const {
  globalShortcut,
  BrowserWindow,
  nativeImage,
  ipcMain,
  dialog,
  Menu,
  Tray,
  app
} = require('electron');

//---- Node ----
const path = require('path');
const url = require('url');

/* --------------------------------- Variables --------------------------------- */
// let configWindow = null;
let mainWindow = null;
const shortKeys = {
  'CommandOrControl+F': 'search-song', // Input search
  'Esc': 'close-search-song', // Cerrar input search
  'CommandOrControl+Up': 'play-and-pause-song', // Play & Pause
  'CommandOrControl+Right': 'next-song', // Next
  'CommandOrControl+Left': 'prev-song', // Prev
  'CommandOrControl+Down': 'shuffle' // Shuffle
};
let thumbarButtons = {};

/* --------------------------------- Funciones --------------------------------- */
function closeRegisteredKeys() {
  Object.keys(shortKeys).forEach(v => globalShortcut.unregister(v));
}

function registreKeys() {
  Object.keys(shortKeys).forEach(v => {
    globalShortcut.register(v, () => mainWindow.webContents.send(shortKeys[v]));
  });
}

// Make the icon of the app
function makeIcon(name) {
  return nativeImage.createFromPath(path.join(__dirname, 'assets', 'img', name));
}

function ready() {
  // Make all the config files
  require('./../app/assets/js/config').createFiles(app);

  // Set the menu
  const menu = Menu.buildFromTemplate(require('./../app/assets/js/menu')(app));

  // Will shows the icon of the notificaion
  const appIcon = new Tray(path.join(__dirname, 'assets', 'img', 'icon.png'));

  // Player
  mainWindow = new BrowserWindow({
    title: 'Soube',
    autoHideMenuBar: true,
    defaultEncoding: 'utf-8',
    useContentSize: true,
    minHeight: 640,
    minWidth: 600,
    height: 600,
    center: true,
    width: 1200,
    show: false,
    icon: makeIcon('icon.png')
  });

  mainWindow.setMenu(menu);
  mainWindow.setMenuBarVisibility(true);
  mainWindow.setAutoHideMenuBar(false);
  mainWindow.center();
  mainWindow.webContents.openDevTools();
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'views', 'main', 'index.html'),
      protocol: 'file:'
    })
  );
  mainWindow.on('closed', () => {
    closeRegisteredKeys();
    appIcon.destroy();
    mainWindow = null;
  })
  .on('focus', registreKeys)
  .on('blur', closeRegisteredKeys)
  .on('minimize', () => mainWindow.webContents.send('save-current-time'))
  // This happens also when you reload the website (refresh)
  .on('restore', () => mainWindow.webContents.send('update-current-time'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Thumbar-button [Windows]
    if (process.platform === 'win32') {
      thumbarButtons = require('./../app/assets/js/thumbar').makeThumBar(mainWindow, {
        next: makeIcon('thumb-next.png'),
        pause: makeIcon('thumb-pause.png'),
        prev: makeIcon('thumb-prev.png'),
        play: makeIcon('thumb-play.png')
      });

      // Thumbar Buttons
      mainWindow.setThumbarButtons(thumbarButtons.playMomment);
    }
  });
}

/* --------------------------------- Electronjs O_o --------------------------------- */
app.on('window-all-closed', () => app.quit());
app.on('ready', ready);

/* --------------------------------- Ipc Main --------------------------------- */
// Sending data from the EQ to the AudioContext
ipcMain.on('equalizer-filter', (e, a) => mainWindow.webContents.send('get-equalizer-filter', a));

// Updating of the thumbar buttons
ipcMain.on('thumb-bar-update', (e, a) => mainWindow.setThumbarButtons(thumbarButtons[a]));

// Displays messages dialogs
// types of messages: none, info, error, question or warning.
ipcMain.on('display-msg', (e, a) =>
  dialog.showMessageBox({
    type: a.type,
    message: a.message,
    detail: a.detail,
    buttons: a.buttons
  })
);

// Reload the main windows
ipcMain.on('update-browser', (e, a) => mainWindow.reload());

// Change the title of the window
ipcMain.on('update-title', (e, a) => mainWindow.setTitle(a));