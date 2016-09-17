process.env.NODE_ENV = 'production'

/** ---------------------------- Módulos ---------------------------- **/
const {
  ipcMain,
  app,
  BrowserWindow,
  globalShortcut,
  Tray
} = require('electron')

/** ---------------------------- Variables ---------------------------- **/
let configWindow = null
let mainWindow = null
let isCloseAble = false

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
}

function ready() {
  // Mostrará el icono de notificación
  const appIcon = new Tray(`${__dirname}/assets/img/icon.png`)

  // Reproductor
  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    defaultEncoding: 'utf-8',
    useContentSize: true,
    minHeight: 600,
    minWidth: 600,
    height: 600,
    center: true,
    width: 1200,
    titleBarStyle: 'hidden',
    show: false,
    icon: `${__dirname}/assets/img/icon.png`
  })

  mainWindow.webContents.openDevTools()
  mainWindow.setMenu(null)
  mainWindow.loadURL(`file://${__dirname}/views/main/index.html`)
  mainWindow.on('closed', () => {
    close_registred_keys()
    appIcon.destroy()
    isCloseAble = true
    BrowserWindow.getAllWindows().forEach(v => { v.close() })
    mainWindow = configWindow = null
  })
    .on('focus', registre_keys)
    .on('blur', close_registred_keys)

  // Deslegar la ventana una vez esté cargado todo el contenido del DOM
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Ventana de configuraciones
  configWindow = new BrowserWindow({
    autoHideMenuBar: true,
    defaultEncoding: 'utf-8',
    useContentSize: false,
    maxHeight: 500,
    minHeight: 500,
    minWidth: 780,
    maxWidth: 780,
    height: 500,
    center: true,
    width: 780,
    titleBarStyle: 'hidden',
    show: false,
    icon: `${__dirname}/assets/img/icon.png`
  })

  configWindow.webContents.openDevTools()
  configWindow.setMenu(null)
  configWindow.loadURL(`file://${__dirname}/views/config-panel/config.html`)
  configWindow.on('close', e => {
    if (!isCloseAble && configWindow.isVisible()) {
      e.preventDefault()
      configWindow.hide()
    }
  })
}

/** ---------------------------- Electronjs Cosas O_o ---------------------------- **/
app.on('window-all-closed', window_all_closed)
app.setName('Soube')
app.on('ready', ready)


/** ---------------------------- Ipc Main ---------------------------- **/
// Desplegar la ventana de configuraciones
ipcMain.on('show-config', () => {
  configWindow.show()
})

// Despliega la lista al actualizarla o al sobre escribir la carpeta de las canciones
ipcMain.on('display-list', () => {
  mainWindow.webContents.send('order-display-list')
})

// Envío de datos desde el equalizador al AudioContext
ipcMain.on('equalizer-filter', (e, a) => {
  mainWindow.webContents.send('get-equalizer-filter', a)
})
