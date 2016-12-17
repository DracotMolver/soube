function factory(nameClass) {
    switch(nameClass.toLowerCase()) {
        case 'equilizer': return require('./../equalizer').eqActions();
    }
}

module.exports = factory;