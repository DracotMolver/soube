process.env.NODE_ENV = 'production';

/** ---------------------------- Módulos ---------------------------- **/
const {
  globalShortcut,
  BrowserWindow,
  nativeImage,
  ipcMain,
  Tray,
  app
} = require('electron');

const path = require('path'); // Crear la ruta usando el separador por defecto del SO
const configFiles = require('./../app/assets/js/configFiles.js');

/** ---------------------------- Variables ---------------------------- **/
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

/** ---------------------------- Funciones ---------------------------- **/
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

function ready() {
  // Mostrará el icono de notificación
  const appIcon = new Tray(path.join(__dirname, 'assets', 'img', 'icon.png'));

  // Reproductor
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
    icon: nativeImage.createFromPath(path.join(__dirname, 'assets', 'img', 'icon.ico'))
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

  // Deslegar la ventana una vez esté cargado todo el contenido del DOM
  mainWindow.once('ready-to-show', () => { 
    mainWindow.show();
  });

  // Crear archivos de configuración
  configFiles.setPath(app);
  configFiles.makeFiles();
}

/** ---------------------------- Electronjs Cosas O_o ---------------------------- **/
app.on('window-all-closed', () => { app.quit(); })
app.setName('Soube');
app.on('ready', ready);


/** ---------------------------- Ipc Main ---------------------------- **/
// Desplegar la ventana de configuraciones
ipcMain.on('show-config', () => {
  if (configWindow === null) {
    // Ventana de configuraciones
    configWindow = new BrowserWindow({
      autoHideMenuBar: true,
      defaultEncoding: 'utf-8',
      useContentSize: true,
      resizable: false,
      height: 500,
      center: true,
      width: 1125,
      icon: nativeImage.createFromPath(path.join(__dirname, 'assets', 'img', 'icon.ico'))
    });

    configWindow.setMenu(null);
    configWindow.webContents.openDevTools();
    configWindow.loadURL(path.join('file://', __dirname, 'views', 'config-panel', 'config.html'));
    configWindow.on('closed', () => {
      configWindow = null;
    });
  }
});

// Despliega la lista al actualizarla o al sobre-escribir la carpeta de las canciones
ipcMain.on('display-list', () => {
  mainWindow.webContents.send('order-display-list');
});

// Envío de datos desde el equalizador al AudioContext
ipcMain.on('equalizer-filter', (e, a) => {
  mainWindow.webContents.send('get-equalizer-filter', a);
});

// Actualiza el idioma del mensaje de la ventana principal
ipcMain.on('update-lang', () => {
  mainWindow.webContents.send('update-init-text');
});