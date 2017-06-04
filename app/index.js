/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
process.env.NODE_ENV = 'production'

/* --------------------------------- Modules --------------------------------- */
// ---- Electron ----
const {
  globalShortcut,
  BrowserWindow,
  nativeImage,
  ipcMain,
  dialog,
  Menu,
  app
} = require('electron')

// ---- Node ----
const path = require('path')
const url = require('url')
// const fs = require('fs')

/* --------------------------------- Variables --------------------------------- */
let mainWindow = null
const shortKeys = {
  'CommandOrControl+Right': 'next-song',
  'CommandOrControl+Left': 'prev-song',
  'CommandOrControl+Down': 'shuffle',
  'CommandOrControl+F': 'search-song',
  'MediaPreviousTrack': 'prev-song',
  'CommandOrControl+E': 'menu-equalizer',
  'CommandOrControl+N': 'menu-add-folder',
  'CommandOrControl+O': 'menu-configurations',
  'CommandOrControl+Shift+A': 'menu-play-album',
  'MediaNextTrack': 'next-song',
  'MediaPlayPause': 'play-and-pause-song',
  'Space': 'play-and-pause-song',
  'Esc': 'close-search-song'
}
let thumbarButtons = {}
let keepUnregistered = []

/* --------------------------------- Funciones --------------------------------- */
// Register the list of keys
function registreKeys() {
  Object.keys(shortKeys).forEach(function (v) {
    if (keepUnregistered.indexOf(v) === -1) {
      globalShortcut.register(v, function () {
        mainWindow.webContents.send(shortKeys[v])
      })
    }
  })
}

// Make the icon of the app
function makeIcon(name) {
  return nativeImage.createFromPath(path.join(__dirname, 'assets', 'img', name))
}

function ready(evt) {
  // Make all the config files
  require(path.join(__dirname, 'assets', 'js', 'config')).createFiles(app)

  // let x = {
  //   'e': evt,
  //   'p': process.argv[1]
  // }

  // fs.writeFileSync(path.join(app.getPath('userData'), 'hola.txt'), JSON.stringify(x), { flag: 'w' });

  // Player
  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    defaultEncoding: 'utf-8',
    useContentSize: true,
    minHeight: 600,
    minWidth: 600,
    height: 680,
    center: true,
    title: 'Soube',
    width: 1240,
    show: false,
    icon: makeIcon('icon.png'),
    webPreferences: {
      nodeIntegrationInWorker: true // Allow to work with Web workers and Nodejs
    }
  })

  mainWindow.setMenu(Menu.buildFromTemplate(require(path.join(__dirname, 'assets', 'js', 'menu'))(app)))
  mainWindow.setMenuBarVisibility(true)
  mainWindow.setAutoHideMenuBar(false)
  mainWindow.center()
  mainWindow.webContents.openDevTools()
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'views', 'main', 'index.html'),
      protocol: 'file:'
    })
  )
  mainWindow.on('closed', function () {
    globalShortcut.unregisterAll()
    mainWindow = null
  }).on('focus', registreKeys)
    .on('blur', function () {
      globalShortcut.unregisterAll()
    }).on('minimize', function () {
      mainWindow.webContents.send('save-current-time')
    }).on('restore', function () {
      // This happens also when you reload the website (refresh)
      mainWindow.webContents.send('update-current-time')
    })

  mainWindow.once('ready-to-show', function () {
    mainWindow.show()

    // Thumbar-button [Windows]
    if (process.platform === 'win32') {
      thumbarButtons = require(path.join(__dirname, 'assets', 'js', 'thumbar'))(mainWindow, {
        next: makeIcon('thumb-next.png'),
        pause: makeIcon('thumb-pause.png'),
        prev: makeIcon('thumb-prev.png'),
        play: makeIcon('thumb-play.png')
      })

      // Thumbar Buttons
      mainWindow.setThumbarButtons(thumbarButtons.playMomment)
    }
  })
}

/* --------------------------------- Electronjs O_o --------------------------------- */
app.on('window-all-closed', function () {
  app.quit()
})
app.disableHardwareAcceleration() // This avoid for example, animations and the shadows.
app.on('ready', ready)

/* --------------------------------- Ipc Main --------------------------------- */
// Sending data from the EQ to the AudioContext
ipcMain.on('equalizer-filter', function (e, a) {
  mainWindow.webContents.send('get-equalizer-filter', a)
})

// Updating of the thumbar buttons
ipcMain.on('thumb-bar-update', function (e, a) {
  mainWindow.setThumbarButtons(thumbarButtons[a])
})

// Displays messages dialogs
// types of messages: none, info, error, question or warning.
ipcMain.on('display-msg', function (e, a) {
  dialog.showMessageBox({
    type: a.type,
    message: a.message,
    detail: a.detail,
    buttons: a.buttons
  })
})

// Reload the main windows
ipcMain.on('update-browser', function () {
  mainWindow.reload()
})

// Change the title of the window
ipcMain.on('update-title', function (e, a) {
  mainWindow.setTitle(a)
})

// Restart the app after change the idiom
ipcMain.on('restart-app', function () {
  app.relaunch()
  app.exit()
})

// Change the size of the window
ipcMain.on('change-screen-size', function (e, a) {
  mainWindow.setMenuBarVisibility(false)
  mainWindow.setMinimumSize(200, 90)
  mainWindow.setMaximizable(false)
  mainWindow.setResizable(false)
  mainWindow.setContentBounds({
    x: a.width - 200,
    y: a.height - 90,
    width: 200,
    height: 90
  })
})

// Unregister and register specific shortkey
ipcMain.on('close-specific-key', function (e, a) {
  if (a.keepUnregistered)
    keepUnregistered.push(a.keyName)

  globalShortcut.unregister(a.keyName)
})

ipcMain.on('open-specific-key', function (e, a) {
  if (keepUnregistered.indexOf(a) !== -1)
    keepUnregistered.splice(keepUnregistered.indexOf(a), 1)

  globalShortcut.register(a, function () {
    mainWindow.webContents.send(shortKeys[a])
  })
})
