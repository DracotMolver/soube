process.env.NODE_ENV = 'production'

/** ---------------------------- Módulos ---------------------------- **/
const {
  ipcMain,
  app,
  BrowserWindow,
  globalShortcut
} = require('electron')

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
}

function registre_keys() {
  globalShortcut.register('CommandOrControl+F', () => {
    mainWindow.webContents.send('search-song')
  })

  globalShortcut.register('Esc', () => {
    mainWindow.webContents.send('close-search-song')
  })
}

function ipc_main_actions() {
  // Desplegar la ventana de configuraciones
  ipcMain.on('show-config', () => {
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
      title: 'Soube',
      icon: `${__dirname}/assets/img/icon.png`
    })

    configWindow.webContents.openDevTools()
    configWindow.setMenu(null)
    configWindow.loadURL(`file://${__dirname}/views/config-panel/config.html`)
  })

  // Despliega la lista al actualizarla o al sobre escribir la carpeta de las canciones
  ipcMain.on('display-list', () => {
    mainWindow.webContents.send('order-display-list')
  })

  // Envío de datos desde el equalizador al AudioContext
  ipcMain.on('equalizer-filter', (e, a) => {
    mainWindow.webContents.send('get-equalizer-filter', a)
  })
}

function ready () {
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
    title: 'Soube',
    icon: `${__dirname}/assets/img/icon.png`
  })

  mainWindow.webContents.openDevTools()
  mainWindow.setMenu(null)
  mainWindow.loadURL(`file://${__dirname}/views/main/index.html`)
  mainWindow.on('closed', () => {
    close_registred_keys()
    BrowserWindow.getAllWindows().forEach(v => { v.close() })
  })
  .on('focus', registre_keys)
  .on('blur', close_registred_keys)


  // Comunicación entre la ventana principal y otras
  ipc_main_actions()
}

/** ---------------------------- Electronjs Cosas O_o ---------------------------- **/
app.on('window-all-closed', window_all_closed)
app.on('ready', ready)
