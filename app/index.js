process.env.NODE_ENV = 'production';

/* --------------------------------- Modules --------------------------------- */
//---- Electron ----
const {
  globalShortcut,
  BrowserWindow,
  nativeImage,
  ipcMain,
  Tray,
  app
} = require('electron');

//---- Node ----
const path = require('path');

//---- Own ----
const config = require('./../app/assets/js/config');
const thumbar = require('./../app/assets/js/thumbar'); // [Windows]

/* --------------------------------- Variables --------------------------------- */
let configWindow = null;
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
  Object.keys(shortKeys).forEach(v => { globalShortcut.unregister(v); });
}

function registreKeys() {
  Object.keys(shortKeys).forEach(v => {
    globalShortcut.register(v, () => {
      mainWindow.webContents.send(shortKeys[v]);
    });
  });
}

// Make the icon of the app
function makeIcon(name) {
  return nativeImage.createFromPath(path.join(__dirname, 'assets', 'img', name));
}

function ready() {
  // Make all the config files
  config.createFiles(app);

  // Will shows the icon of the notificaion
  const appIcon = new Tray(path.join(__dirname, 'assets', 'img', 'icon.png'));

  // Player
  mainWindow = new BrowserWindow({
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

  mainWindow.setMenu(null);
  mainWindow.webContents.openDevTools();
  mainWindow.loadURL(path.join('file://', __dirname, 'views', 'main', 'index.html'));
  mainWindow.on('closed', () => {
    closeRegisteredKeys();
    appIcon.destroy();
    BrowserWindow.getAllWindows().forEach(v => { v.close(); });
    mainWindow = configWindow = null;
  })
  .on('focus', registreKeys)
  .on('blur', closeRegisteredKeys);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Thumbar-button [Windows]
    if (process.platform === 'win32') {
     thumbarButtons = thumbar.makeThumBar(mainWindow, {
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
app.on('window-all-closed', () => { app.quit(); })
app.setName('Soube');
app.on('ready', ready);

/* --------------------------------- Ipc Main --------------------------------- */
// Config panel
ipcMain.on('show-config', () => {
  if (configWindow === null) {
    configWindow = new BrowserWindow({
      autoHideMenuBar: true,
      defaultEncoding: 'utf-8',
      useContentSize: true,
      resizable: false,
      height: 500,
      center: true,
      width: 1125,
      icon: makeIcon('icon.png')
    });

    configWindow.setMenu(null);
    configWindow.webContents.openDevTools();
    configWindow.loadURL(path.join('file://', __dirname, 'views', 'config-panel', 'config.html'));
    configWindow.on('closed', () => {
      configWindow = null;
    });
  }
});

// Displays the list of song after update or overwrite the song folder
ipcMain.on('display-list', () => {
  mainWindow.webContents.send('order-display-list');
});

// Sending data from the EQ to the AudioContext
ipcMain.on('equalizer-filter', (e, a) => {
  mainWindow.webContents.send('get-equalizer-filter', a);
});

// Updating of the thumbar buttons
ipcMain.on('thumb-bar-update', (e, a) => {
  mainWindow.setThumbarButtons(thumbarButtons[a]);
});