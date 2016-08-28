process.env.NODE_ENV = 'production'

// Llamar a los módulos necesarios en el proceso principal
const {
  ipcMain,
  app,
  BrowserWindow,
  globalShortcut
} = require('electron')

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('ready', () => {
  let isShortcutRegistered = !0

  // Reproductor
  let mainWindow = new BrowserWindow({
    autoHideMenuBar: !0,
    defaultEncoding: 'utf-8',
    useContentSize: !0,
    minHeight: 600,
    minWidth: 600,
    height: 600,
    center: !0,
    width: 1200,
    title: 'Soube',
    icon: `${__dirname}/assets/img/icon.png`
  })

  mainWindow.webContents.openDevTools()
  mainWindow.setMenu(null)
  mainWindow.loadURL(`file://${__dirname}/views/main/index.html`)
  mainWindow.on('closed', () => {
    BrowserWindow.getAllWindows().forEach(v => { v.close() })
    if (isShortcutRegistered) globalShortcut.unregister('CommandOrControl+F')
  }).on('focus', () => {
    if (isShortcutRegistered) {
      isShortcutRegistered = globalShortcut.register('CommandOrControl+F', () => {
        mainWindow.webContents.send('input-search-song')
      })
    }
  }).on('blur', () => {
    if (isShortcutRegistered) globalShortcut.unregister('CommandOrControl+F')
  })

  // Despliega la ventana para configurar varias cosas :P
  ipcMain.on('show-config', () => {
    // Ventana de configuraciones
    let configWindow = new BrowserWindow({
      autoHideMenuBar: !0,
      defaultEncoding: 'utf-8',
      useContentSize: !1,
      maxHeight: 500,
      minHeight: 500,
      minWidth: 780,
      maxWidth: 780,
      height: 500,
      center: !0,
      width: 780,
      title: 'Soube',
      icon: `${__dirname}/assets/img/icon.png`
    })

    configWindow.webContents.openDevTools()
    configWindow.setMenu(null)
    configWindow.loadURL(`file://${__dirname}/views/config-panel/config.html`)
  })

  // Comunicación entre la ventanan principal y la de configuración.
  // Se debe usar el proceso principal para comunicar entre distintos renders.
  /* ---------------------------------------------/ / /-------------------------------------------- */
  // Despliega la lista al actualizarla o al sobre escribir la carpeta de las canciones
  ipcMain.on('display-list', () => {
    mainWindow.webContents.send('order-display-list')
  })

  // Comunica la ventana de configuraciones con la ventana principal.
  // Envío de datos desde el equalizador al AudioContext
  ipcMain.on('equalizer-filter', (e, a) => {
    mainWindow.webContents.send('get-equalizer-filter', a)
  })
})
