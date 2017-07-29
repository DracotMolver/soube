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
    // This was using a forEach before. But it has no sense if there's only a few elements
    // that I can typed down. It would look an awful code, a large one, but the performance it's better
    // becuase there's no need of a bucle
    if (keepUnregistered.indexOf(shortKeys['CommandOrControl+Right']) === -1)
        globalShortcut.register('CommandOrControl+Right', function () {
            mainWindow.webContents.send(shortKeys['CommandOrControl+Right'])
        })
    if (keepUnregistered.indexOf(shortKeys['CommandOrControl+Down']) === -1)
        globalShortcut.register('CommandOrControl+Down', function () {
            mainWindow.webContents.send(shortKeys['CommandOrControl+Down'])
        })
    if (keepUnregistered.indexOf(shortKeys['CommandOrControl+F']) === -1)
        globalShortcut.register('CommandOrControl+F', function () {
            mainWindow.webContents.send(shortKeys['CommandOrControl+F'])
        })
    if (keepUnregistered.indexOf(shortKeys['MediaPreviousTrack']) === -1)
        globalShortcut.register('MediaPreviousTrack', function () {
            mainWindow.webContents.send(shortKeys['MediaPreviousTrack'])
        })
    if (keepUnregistered.indexOf(shortKeys['CommandOrControl+E']) === -1)
        globalShortcut.register('CommandOrControl+E', function () {
            mainWindow.webContents.send(shortKeys['CommandOrControl+E'])
        })
    if (keepUnregistered.indexOf(shortKeys['CommandOrControl+N']) === -1)
        globalShortcut.register('CommandOrControl+N', function () {
            mainWindow.webContents.send(shortKeys['CommandOrControl+N'])
        })
    if (keepUnregistered.indexOf(shortKeys['CommandOrControl+O']) === -1)
        globalShortcut.register('CommandOrControl+O', function () {
            mainWindow.webContents.send(shortKeys['CommandOrControl+O'])
        })
    if (keepUnregistered.indexOf(shortKeys['CommandOrControl+Shift+A']) === -1)
        globalShortcut.register('CommandOrControl+Shift+A', function () {
            mainWindow.webContents.send(shortKeys['CommandOrControl+Shift+A'])
        })
    if (keepUnregistered.indexOf(shortKeys['MediaNextTrack']) === -1)
        globalShortcut.register('MediaNextTrack', function () {
            mainWindow.webContents.send(shortKeys['MediaNextTrack'])
        })
    if (keepUnregistered.indexOf(shortKeys['MediaPlayPause']) === -1)
        globalShortcut.register('MediaPlayPause', function () {
            mainWindow.webContents.send(shortKeys['MediaPlayPause'])
        })
    if (keepUnregistered.indexOf(shortKeys['Space']) === -1)
        globalShortcut.register('Space', function () {
            mainWindow.webContents.send(shortKeys['Space'])
        })
    if (keepUnregistered.indexOf(shortKeys['Esc']) === -1)
        globalShortcut.register('Esc', function () {
            mainWindow.webContents.send(shortKeys['Esc'])
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
    mainWindow.on('closed', function () {
        globalShortcut.unregisterAll()
        mainWindow = null
    }).on('focus', registreKeys)
        .on('blur', function () {
            // Needed because the globalShortcut.register take the whole OS.
            // So if we are gonna use space without unregister the keyword,
            // it won't work for any app or propouse
            globalShortcut.unregisterAll()
        }).on('minimize', function () {
            // For the time lapse (progress of the song)
            mainWindow.webContents.send('save-current-time')
        }).on('restore', function () {
            // For the time lapse (progress of the song)
            // This happens also when we reload the view (refresh)
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
    // Close the app, it doesn't matter which OS we are using
    app.quit()
})
app.disableHardwareAcceleration() // This avoid, for example, animations and the shadows.
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

// Reloads the main window
ipcMain.on('update-browser', function () {
    mainWindow.reload()
})

// Changes the title of the window for any song
ipcMain.on('update-title', function (e, a) {
    mainWindow.setTitle(a)
})

// Restarts the app after have had changed the idiom
ipcMain.on('restart-app', function () {
    app.relaunch()
    app.exit()
})

// Changes the size of the window. Like an small mucis player
ipcMain.on('change-screen-size', function (e, a) {
    mainWindow.setMenuBarVisibility(!a.screenResize)
    mainWindow.setMinimumSize(a.screenResize ? 300 : 440, a.screenResize ? 90 : 600)
    mainWindow.setMaximizable(!a.screenResize)
    mainWindow.setResizable(!a.screenResize)
    mainWindow.setContentBounds({
        x: a.screenResize ? a.area.width - 300 : a.area.x,
        y: a.screenResize ? a.area.height - 90 : a.area.y,
        width: a.screenResize ? 300 : a.area.width,
        height: a.screenResize ? 90 : a.area.height
    })

    if (!a.screenResize) mainWindow.center()
})

// Set the window always on top, no matter which app are you using
ipcMain.on('set-on-top', function (e, a) {
    mainWindow.setAlwaysOnTop(a, 'normal')
})

// Unregister and register specific shortkeys
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
