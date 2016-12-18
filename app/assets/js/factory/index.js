function factory(nameClass) {
  switch (nameClass.toLowerCase()) {
    case 'equilizer': return require('./../equalizer').eqActions();
    case 'player': return require('./../player');
  }
}

module.exports = factory;