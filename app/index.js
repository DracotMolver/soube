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
  // Reproductor
  let mainWindow = new BrowserWindow({
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
    // Cerrar los keys registrados
    globalShortcut.unregister('CommandOrControl+F')
    globalShortcut.unregister('Esc')

    BrowserWindow.getAllWindows().forEach(v => { v.close() })
  }).on('focus', () => {
    // Abrir inputsearch
    globalShortcut.register('CommandOrControl+F', () => {
      mainWindow.webContents.send('search-song')
    })

    // Cerrar inputsearch
    globalShortcut.register('Esc', () => {
      mainWindow.webContents.send('close-search-song')
    })
  }).on('blur', () => {
    // Cerrar los keys registrados
    globalShortcut.unregister('CommandOrControl+F')
    globalShortcut.unregister('Esc')
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
