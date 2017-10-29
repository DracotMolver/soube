/**
 * @module index
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * Here it's creates the BrowserWindow, defines the shortkeys and some ipcMain
 * to communicate the render process with the main process.
 * This is executed before calling the render processing.
 */
/* --------------------------------- Modules --------------------------------- */
process.env.NODE_ENV = 'production'

// ---- Electron ----
const electron = require('electron')
const {
    globalShortcut,
    BrowserWindow,
    nativeImage,
    ipcMain,
    dialog,
    Menu,
    app
} = electron

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
function registerKeys() {
    Object.keys(shortKeys).forEach(k => {
        keepUnregistered.includes(k) || globalShortcut.register(k, () => mainWindow.webContents.send(shortKeys[k]));
    })
}

// Makes some needed icons
function makeIcon(name) {
    return nativeImage.createFromPath(path.join(__dirname, 'assets', 'img', name))
}

function ready(evt) {
    // Makes all the needed config files
    require(path.join(__dirname, 'assets', 'js', 'config')).createFiles(app)

    // let x = {
    //   'e': evt,
    //   'p': process.argv[1]
    // }

    // fs.writeFileSync(path.join(app.getPath('userData'), 'hola.txt'), JSON.stringify(x), { flag: 'w' });
    // Get the screen size of the device
    // It doesn't feet at 100%, it has some margins, not much.
    const workArea = electron.screen.getPrimaryDisplay().workArea

    mainWindow = new BrowserWindow({
        backgroundColor: '#fff',
        autoHideMenuBar: true,
        defaultEncoding: 'utf-8',
        useContentSize: true,
        hasShadow: false,
        minHeight: 600,
        minWidth: 440,
        height: workArea.height,
        center: true,
        title: 'Soube',
        width: workArea.width,
        show: false,
        icon: makeIcon('icon.png'),
        webPreferences: {
            nodeIntegrationInWorker: true // Allow to work with Web workers and Nodejs in one file
        }
    })

    mainWindow.setMenu(Menu.buildFromTemplate(require(path.join(__dirname, 'assets', 'js', 'menu'))(app)))
    mainWindow.setMenuBarVisibility(true)
    mainWindow.setAutoHideMenuBar(false)
    mainWindow.center()
    mainWindow.webContents.openDevTools() // Hide for production
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, 'views', 'main', 'index.html'),
            protocol: 'file:'
        })
    )
    mainWindow.on('closed', () => {
        globalShortcut.unregisterAll()
        mainWindow = null
    })
    .on('focus', registerKeys)
    // Needed because the globalShortcut.register take the whole OS.
    // So if we are gonna use space without unregister the keyword,
    // it won't work for any app or propouse
    .on('blur', () => globalShortcut.unregisterAll())
    .on('restore', () => globalShortcut.unregisterAll())

    mainWindow.once('ready-to-show', () => {
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
// Close the app, it doesn't matter which OS we are using
app.on('window-all-closed', () => app.quit())
app.disableHardwareAcceleration() // This avoid, for example, animations and the shadows.
app.on('ready', ready)

/* --------------------------------- Ipc Main --------------------------------- */
// Sending data from the EQ to the AudioContext
ipcMain.on('equalizer-filter', (e, a) => mainWindow.webContents.send('get-equalizer-filter', a))

// Updating of the thumbar buttons
ipcMain.on('thumb-bar-update', (e, a) => mainWindow.setThumbarButtons(thumbarButtons[a]))

// Displays messages dialogs
// types of messages: none, info, error, question or warning.
ipcMain.on('display-msg', (e, a) => dialog.showMessageBox({
    type: a.type,
    message: a.message,
    detail: a.detail,
    buttons: a.buttons
}))

// Reloads the main window
ipcMain.on('update-browser', () => mainWindow.reload())

// Changes the title of the window for any song
ipcMain.on('update-title', (e, a) => mainWindow.setTitle(a))

// Restarts the app after have had changed the idiom
ipcMain.on('restart-app', () => {
    app.relaunch()
    app.exit()
})

// Changes the size of the window. Like an small mucis player
ipcMain.on('change-screen-size', (e, a) => {
    mainWindow.setMenuBarVisibility(!a.screenResize)
    mainWindow.setMinimumSize(a.screenResize ? 360 : 440, a.screenResize ? 82 : 600)
    mainWindow.setMaximizable(!a.screenResize)
    mainWindow.setResizable(!a.screenResize)
    mainWindow.setContentBounds({
        x: a.screenResize ? a.area.width - 360 : a.area.x,
        y: a.screenResize ? a.area.height - 82 : a.area.y,
        width: a.screenResize ? 360 : a.area.width,
        height: a.screenResize ? 82 : a.area.height
    })

    a.screenResize || mainWindow.center();
})

// Set the window always on top, no matter which app are you using
ipcMain.on('set-on-top', (e, a) => mainWindow.setAlwaysOnTop(a, 'normal'))

ipcMain.on('close-specific-key', (e, a) => {
    a.keepUnregistered && keepUnregistered.push(a.keyName);
    globalShortcut.unregister(a.keyName)
})
ipcMain.on('open-specific-key', (e, a) => {
    keepUnregistered.includes(a) && keepUnregistered.splice(keepUnregistered.indexOf(a), 1);
    globalShortcut.register(a, () => mainWindow.webContents.send(shortKeys[a]))
})
