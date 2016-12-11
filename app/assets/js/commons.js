/**
 * @author Diego Alberto Molina Vera
 */
// // Template para manipural el DOM
// require('./template');

// Módulos
// const { remote } = require('electron');
// const fs = require('fs');
// const path = require('path');

// Globales
// global.CONFIG_FILE = `${remote.app.getPath('userData')}/config.json`;
// global.SONG_FILE = `${remote.app.getPath('userData')}/listSong.json`;
// global.LANG_FILE = path.join(__dirname, '..', 'files', 'lang.json');

// global.jread = data => JSON.parse(fs.readFileSync(data, { encoding: 'utf8', flag: 'r' }));
// global.jsave = (data, c) => {
//   fs.writeFileSync(data, JSON.stringify(c, null), { encoding: 'utf8', mode: 511, flag: 'w' });
//   return jread(data);
// }