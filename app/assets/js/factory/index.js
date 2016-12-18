function factory(nameClass) {
  switch (nameClass.toLowerCase()) {
    case 'equilizer': return require('./../player/equalizer');
    case 'player': return require('./../player');
  }
}

module.exports = factory;