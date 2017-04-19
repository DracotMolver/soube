/* --------------------------------------- Variables ------------------------------------------- */
//---- constants ----
const xhtr = new XMLHttpRequest(); // Object XMLHttpRequest

/* --------------------------------------- Functions ------------------------------------------- */
function getBuffer(filePath) {
  // console.log(filePath);
  xhtr.open('GET', filePath, true);
  xhtr.responseType = 'arraybuffer';
  xhtr.onload = () => postMessage({
    response: xhtr.response
  });
  xhtr.send(null);
}

function abort() {
  xhtr.abort();
}

this.onmessage = e => {
  switch (e.data.action) {
    case 'getBuffer': getBuffer(e.data.filePath); break;
    case 'abort': abort(); break;
  }
};