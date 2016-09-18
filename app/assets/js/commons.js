/**
 * @author Diego Alberto Molina Vera
 */
// Template para manipural el DOM
require('./template')

// Módulos
const {
  remote,
  ipcRenderer
} = require('electron')

const metaData = require('musicmetadata')
const execFile = require('child_process').execFile
const fs = require('fs')
const path = require('path')

// Globales
global.CONFIG_FILE = path.join(__dirname, '..', 'files', 'config.json')
global.SONG_FILE = path.join(__dirname, '..', 'files', 'listSong.json')
global.LANG_FILE = path.join(__dirname, '..', 'files', 'lang.json')

global.jread = data => JSON.parse(fs.readFileSync(data, { encoding: 'utf8', flag: 'r' }))
global.jsave = (data, c) => {
  fs.writeFileSync(data, JSON.stringify(c, null, 4))
  return jread(data)
}

module.exports = {
  dialog: remote.dialog,
  ipcRenderer,
  metaData,
  execFile,
  path,
  fs
}
