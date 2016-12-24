/**
 * @author Diego Alberto Molina Vera
 */
  /* --------------------------------- Módulos --------------------------------- */
// Nodejs módulos
const fs = require('fs');

// Electron módulos
const remote = require('electron').remote;

function createFiles(path) {
  /* --------------------------------- Configuración --------------------------------- */
  const configPath = `${path}/config.json`;
  const eq = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  fs.stat(configPath, (err, stats) => {
    if (err) {
      const config = {
        lang: 'us', // Idioma por defecto
        shuffle: true, // Activar/Desactivar Shuffle
        musicFolder: '', // Ubicación de la carpeta de música
        equalizer: eq // Equilizador
      };

      fs.open(configPath, 'w', (err, fd) => {
        if (err) return;

        fs.writeFileSync(configPath, JSON.stringify(config, null), { flag: 'w' });
        fs.closeSync(fd);
      });
    } else {
      // SOLO PARA LAS VERSIONES DE SOUBE MENORES A LA 1.3.2
      let config = JSON.parse(fs.readFileSync(configPath).toString());
      if (config.equalizer.length < 23) {
        config.equalizer = eq;
        fs.writeFileSync(configPath, JSON.stringify(config, null), { flag: 'w' });
      }
    }
  });

  /* --------------------------------- Archivo de canciones --------------------------------- */
  const listSongPath = `${path}/listSong.json`;
  fs.stat(listSongPath, (err, stats) => {
    if (err) {
      fs.open(listSongPath, 'w', (err, fd) => {
        if (err) return;

        fs.writeFileSync(listSongPath, JSON.stringify({}, null), { flag: 'w' });
        fs.closeSync(fd);
      });
    }
  });
}

function editFile(fileName, data) {
  fs.writeFile(`${remote.app.getPath('userData')}/${fileName}.json`, JSON.stringify(data, null), err => { });
}

function init() {
  const configFile = require(`${remote.app.getPath('userData')}/config.json`);
  const langFile = require('./lang.json');
  const listSongs = require(`${remote.app.getPath('userData')}/listSong.json`);;

  return {
    editFile,
    configFile,
    listSongs,
    langFile
  }
}

module.exports = Object.freeze({
  createFiles,
  init
});