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
  app
} = require('electron');

//---- Node ----
const path = require('path');
const url = require('url');

/* --------------------------------- Variables --------------------------------- */
let mainWindow = null;
const shortKeys = {
  'CommandOrControl+F': 'search-song',
  'Esc': 'close-search-song',
  'Space': 'play-and-pause-song',
  'MediaPlayPause': 'play-and-pause-song',
  'CommandOrControl+Right': 'next-song',
  'MediaNextTrack': 'next-song',
  'CommandOrControl+Left': 'prev-song',
  'MediaPreviousTrack': 'prev-song',
  'CommandOrControl+Down': 'shuffle',
  'CommandOrControl+E': 'menu-equalizer',
  'CommandOrControl+N': 'menu-add-folder',
  'CommandOrControl+O': 'menu-configurations',
  'CommandOrControl+A': 'menu-play-album'
};
let thumbarButtons = {};

/* --------------------------------- Funciones --------------------------------- */
function closeRegisteredKeys() {
  Object.keys(shortKeys).forEach(v => globalShortcut.unregister(v));
}

function registreKeys() {
  Object.keys(shortKeys).forEach(v =>
    globalShortcut.register(v, () => mainWindow.webContents.send(shortKeys[v]))
  );
}

// Make the icon of the app
function makeIcon(name) {
  return nativeImage.createFromPath(path.join(__dirname, 'assets', 'img', name));
}

function ready() {
  // Make all the config files
  require(path.join(__dirname, 'assets', 'js', 'config')).createFiles(app);

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
    icon: makeIcon('icon.png'),
    webPreferences: {
      nodeIntegrationInWorker: true
    }
  });

  mainWindow.setMenu(Menu.buildFromTemplate(require(path.join(__dirname, 'assets', 'js', 'menu'))(app)));
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
      thumbarButtons = require(path.join(__dirname, 'assets', 'js', 'thumbar')).makeThumBar(mainWindow, {
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

// Restart the app after change the idiom
ipcMain.on('restart-app', (e, a) => {
  app.relaunch();
  app.exit();
});