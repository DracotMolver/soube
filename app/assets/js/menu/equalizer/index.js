/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Modules --------------------------------- */
const {
  configFile,
  langFile,
  editFile
} = require('./../../config').init();
require('./../../dom');

/* --------------------------------- Variables --------------------------------- */
//---- normals ----
let lang = langFile[configFile.lang];
let range = null;
let eqHrz = 0;
let _pos = 0;
let pos = 0;
let _db = 0;
let db = 0;
let y = 0;

/* --------------------------------- Functions --------------------------------- */
// Options to config the EQ
function setEQ () {
  configFile.equalizerConfig = this.value;
  editFile('config', configFile);

  eqHrz = configFile.equalizer[configFile.equalizerConfig];
  $('.range-circle').each((v, i) => {
    $(v).css(`top:${eqHrz[i] === 0 ? 130 : eqHrz[i]}px`);

    ipcRenderer.send('equalizer-filter', [i,
      eqHrz[i] !== 0 ? parseFloat((eqHrz[i] < 130 ? 121 - eqHrz[i] : -eqHrz[i] + 140) / 10) : 0
    ]);
  });
}

function showEqualizer() {
  $($('.grid-container').get(0)).css('-webkit-filter:blur(1px)');
  $('#_equalizerSetting').text(lang.config.equalizerSetting);
  // $('#_neweq').text(lang.config.newEQ);

  // EQ select settings options
  const fragment = document.createDocumentFragment();
  Object.keys(configFile.equalizer).forEach(v => {
    fragment.appendChild(
      $('option')
        .clone(true)
        .val(v)
        .text(v)
        .attr(configFile.equalizerConfig === v.toLowerCase() ? { selected: 'selected' } : '')
        .get()
    )
  });

  // Option to add a new EQ  
  fragment.appendChild(
    $('option')
      .clone(true)
      .val('new')
      .text(lang.config.addNewEQSetting)
      .get()
  );

  $('#eq-buttons')
    .insert(fragment)
    .on({ change: setEQ });

  $($('.parent-container-config').get(1))
    .removeClass('hide')
    .child(0)
    .addClass('container-config-anim');

  // Set the EQ choosen config
  // let newEQHrz = 
  eqHrz = configFile.equalizer[configFile.equalizerConfig];
  $('.range-circle')
    // .each(
    // (v, i) => $(v).css(`top:${eqHrz[i] === 0 ? 130 : eqHrz[i]}px`)
  // )
  .on({
    mousedown: function () {
      pos = $((range = this)).data('position');
    },
  });

  $('.range-container').on({
    mousemove: e => {
      if (range !== null) {
        // if (e.movementY <= -1) db++;
        // else if (e.movementY >= 1) db--;
        db = e.screenY - range.offsetTop;
        console.log(db)
        // console.log(e.screenY - (range.offsetTop - (range.clientHeight / 2)))
        // $(range).css(`margin-top:${db}px`);
        // y = e.offsetY / 10;
        // if (y >= 0 && y <= 10) console.log('up');
        // else if (y >= 1 && y <= 24) console.log('down')
      }
    }
  });
  // $(document).on({
  // //   mouseup: () => {
  // //     console.log(pos, db, range)
  // //   },
  //   mousemove: e => {
  //       // if (db > 0 && db < 261)
  //       // $(range).css(`top:${db}px`);
  // //       // console.log($(range).data('position'), db !== 0 ? parseFloat((db < 130 ? 121 - db : -db + 140) / 10) : 0);
  // //       // return fn([
  // //         // $(range).data('position'),
  // //         // db !== 0 ? parseFloat((db < 130 ? 121 - db : -db + 140) / 10) : 0
  // //       // ]);
  //     }
  //   }
  // });
}

function close() {
  range = null;
  eqHrz = _pos = pos = _db = db = y = 0;
}

module.exports = {
  showEqualizer,
  close
};