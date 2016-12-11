const metadataWorker = require('./metadataWorker');

function worker(name) {
  switch(name.toLowerCase()) {
    case 'metadataworker': return metadataWorker;
  }
}


module.exports = Object.freeze({
  worker
});