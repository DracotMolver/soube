/**
 * @author Diego Molina Vera.
 *
 * Crear archivo de configuración y el archiv donde se almacenarán las canciones
 */

const fs = require('fs');

function makeFiles(path) {
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

        fs.writeFileSync(configPath, JSON.stringify(config, null), { encoding: 'utf8', flag: 'w' });
        fs.closeSync(fd);
      });
    } else {
      // SOLO PARA LAS VERSIONES DE SOUBE MENORES A LA 1.3.2
      let config = JSON.parse(fs.readFileSync(configPath).toString());
      if (config.equalizer.length < 23) {
        config.equalizer = eq;
        fs.writeFileSync(configPath, JSON.stringify(config, null), { encoding: 'utf8', flag: 'w' });
      }
    }
  });

  /* --------------------------------- Archivo de canciones --------------------------------- */
  const listSongPath = `${path}/listSong.json`;
  fs.stat(listSongPath, (err, stats) => {
    if (err) {
      fs.open(listSongPath, 'w', (err, fd) => {
        if (err) return;

        fs.writeFileSync(listSongPath, JSON.stringify({}, null), { encoding: 'utf8', flag: 'w' });
        fs.closeSync(fd);
      });
    }
  });
}

module.exports = Object.freeze({
    makeFiles
});