process.env.NODE_ENV = 'production'

/** ---------------------------- Módulos ---------------------------- **/
const {
  globalShortcut,
  BrowserWindow,
  nativeImage,
  ipcMain,
  Tray,
  app
} = require('electron')

const path = require('path') // Crear la ruta usando el separador por defecto del SO
const configFiles = require('./../app/assets/js/configFiles.js')

/** ---------------------------- Variables ---------------------------- **/
let configWindow = null
let mainWindow = null

/** ---------------------------- Funciones ---------------------------- **/
function window_all_closed() {
  if (process.platform !== 'darwin') app.quit()
}

function close_registred_keys() {
  globalShortcut.unregister('CommandOrControl+F') // Input search
  globalShortcut.unregister('Esc') // Cerrar input search
  globalShortcut.unregister('CommandOrControl+Up') // Play & Pause
  globalShortcut.unregister('CommandOrControl+Right') // Next
  globalShortcut.unregister('CommandOrControl+Left') // Prev
  globalShortcut.unregister('CommandOrControl+Down') // Shuffle
}

function registre_keys() {
  globalShortcut.register('CommandOrControl+F', () => {
    mainWindow.webContents.send('search-song')
  })

  globalShortcut.register('Esc', () => {
    mainWindow.webContents.send('close-search-song')
  })

  globalShortcut.register('CommandOrControl+Up', () => {
    mainWindow.webContents.send('play-and-pause-song')
  })

  globalShortcut.register('CommandOrControl+Right', () => {
    mainWindow.webContents.send('next-song')
  })

  globalShortcut.register('CommandOrControl+Left', () => {
    mainWindow.webContents.send('prev-song')
  })

  globalShortcut.register('CommandOrControl+Down', () => {
    mainWindow.webContents.send('shuffle')
  })
}

function ready() {
  // Mostrará el icono de notificación
  const appIcon = new Tray(path.join(__dirname, 'assets', 'img', 'icon.png'))

  // Reproductor
  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    defaultEncoding: 'utf-8',
    useContentSize: true,
    // titleBarStyle: 'hidden',
    minHeight: 640,
    minWidth: 600,
    height: 600,
    center: true,
    width: 1200,
    show: false,
    icon: nativeImage.createFromPath(path.join(__dirname, 'assets', 'img', 'icon.ico'))
  })


  mainWindow.webContents.openDevTools()
  mainWindow.setMenu(null)
  mainWindow.loadURL(path.join('file://', __dirname, 'views', 'main', 'index.html'))
  mainWindow.on('closed', () => {
    close_registred_keys()
    appIcon.destroy()
    BrowserWindow.getAllWindows().forEach(v => { v.close() })
    mainWindow = configWindow = null
  })
  .on('focus', registre_keys)
  .on('blur', close_registred_keys)

  // Deslegar la ventana una vez esté cargado todo el contenido del DOM
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Crear archivos de configuración
  configFiles.setPath(app.getPath('userData'))
  configFiles.makeFiles()
}

/** ---------------------------- Electronjs Cosas O_o ---------------------------- **/
app.on('window-all-closed', window_all_closed)
app.setName('Soube')
app.on('ready', ready)


/** ---------------------------- Ipc Main ---------------------------- **/
// Desplegar la ventana de configuraciones
ipcMain.on('show-config', () => {
  // Ventana de configuraciones
  configWindow = new BrowserWindow({
    autoHideMenuBar: true,
    defaultEncoding: 'utf-8',
    useContentSize: true,
    // titleBarStyle: 'hidden',
    resizable: false,
    height: 500,
    center: true,
    width: 780,
    icon: nativeImage.createFromPath(path.join(__dirname, 'assets', 'img', 'icon.ico'))
  })

  configWindow.setMenu(null)
  configWindow.webContents.openDevTools()
  configWindow.loadURL(path.join('file://', __dirname, 'views', 'config-panel', 'config.html'))
})

// Despliega la lista al actualizarla o al sobre escribir la carpeta de las canciones
ipcMain.on('display-list', () => {
  mainWindow.webContents.send('order-display-list')
})

// Envío de datos desde el equalizador al AudioContext
ipcMain.on('equalizer-filter', (e, a) => {
  mainWindow.webContents.send('get-equalizer-filter', a)
})
