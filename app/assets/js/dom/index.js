/**
 * Framework pequeño para manipular el DOM
 * @author Diego Alberto Molina Vera
 */

module.exports = (_ => {
  /* --------------------------------- Variables --------------------------------- */
  let poolElements = [];
  let listeners = {
    key: ''
  };
  let poolListeners = [];

  /* --------------------------------- Pools --------------------------------- */
  // Listeners
  const registerListener = (name, listener) => {
    listener.key = name;
    poolListeners[name] = listener;
  }

  const getListener = name => {
    return poolListeners[name];
  };

  // Pool general
  const setPool = (name, element) => {
    poolElements[name] = element;
  };

  const getPool = name => {
    if (poolElements[name]) return poolElements[name];
  };

  const isInPool = name => {
    return poolElements[name] !== undefined;
  };

  /* --------------------------------- Events --------------------------------- */
  const emitters = {
    events: {},
    on: (name, fn) => {
      emitters.events[name] = fn;
    },
    send: (name, ...args) => {
      return emitters.events[name].apply(null, args);
    }
  };

  emitters.on('addClass', (name, str) => {
    let el = getPool(name);
    const rgx = new RegExp(str, 'g');
    const cName = el.className;
    if (!rgx.test(cName)) el.className += cName === '' ? `${str}` : ` ${str}`;

    return getListener(name);
  });

  emitters.on('text', (name, str = null) => {
    let el = getPool(name);

    if (str !== null) el.innerHTML = `${str}`;
    else return el.textContent;

    return getListener(name);
  });

  emitters.on('replaceClass', (name, from, to) => {
    let el = getPool(name);
    el.className = el.className.replace(from, to);

    return getListener(name);
  });

  emitters.on('child', (name, pos = -1) => {
    if(pos > -1) {
      let c = getPool(name).children[pos];
      name = `#${name}-child`;
      setPool(name, c);
      registerListener(name, Object.assign({}, listeners));
    } else {
      return Array.from(getPool(name).children);
    }

    return getListener(name);
  });

  emitters.on('on', (name, fn) => {
    if (getPool(name).length !== undefined) {
      getPool(name).forEach(e => {
        Object.keys(fn).forEach(v => {
          /animation/.test(v) ?
          e.addEventListener(v.toLowerCase(), fn[v]) :
          e[`on${v.toLowerCase()}`] = fn[v];
        });
      });
    } else {
      Object.keys(fn).forEach(v => {
        /animation/.test(v) ?
        getPool(name).addEventListener(v.toLowerCase(), fn[v]) :
        getPool(name)[`on${v.toLowerCase()}`] = fn[v];
      });
    }
  });

  emitters.on('data', (name, data) => {
    if (typeof data === 'string') {
      let d = getPool(name).dataset[data];
      if (/^\d+$/.test(d)) return parseInt(d, 10);
      else if (/^\d+(\.+)\d+$/.test(d)) return parseFloat(d);
      else if (/^(\w|\s)+$/.test(d)) return d.toString();
    } else {
      let el = getPool(name);
      Object.keys(data[0]).forEach(v => {
        el.dataset[v] = data[v];
      });

      return getListener(name);
    }
  });

  emitters.on('each', (name, fn) => {
    let el = getPool(name);
    for (var i = 0, size = el.length; i < size; i++) {
      fn.length === 1 ? fn(el[i]) : fn(el[i], i);
    }

    return getListener(name);
  });

  emitters.on('css', (name, str) => {
    const rgx = new RegExp(str, 'g');
    let cssText = null;
    let el = getPool(name);
    if (el.length !== undefined) {
      el.forEach(e => {
        cssText = e.style;
        if (!rgx.test()) cssText.cssText += cssText.cssText === '' ? `${str};` : ` ${str};`;
      });
    } else {
        cssText = el.style;
        if (!rgx.test()) cssText.cssText += cssText.cssText === '' ? `${str};` : ` ${str};`;
    }
  });

  listeners.addClass = function(str) { return emitters.send('addClass', this.key , str); };
  listeners.text = function(str) { return emitters.send('text', this.key , str); };
  listeners.replaceClass = function(from, to) { return emitters.send('replaceClass', this.key , from, to); };
  listeners.child = function(pos) { return emitters.send('child', this.key , pos); };
  listeners.on = function(fn) { return emitters.send('on', this.key , fn); };
  listeners.data = function(data) { return emitters.send('data', this.key , data); };
  listeners.each = function(fn) { return emitters.send('each', this.key , fn); };
  listeners.css = function(str) { return emitters.send('css', this.key , str); };

    // return {


    //   child: function (p = 'all') { // Buscar hijos
    //     this._e = (p !== 'all' && typeof p === 'number') ? this._e.children[p] : Array.from(this._e.children);
    //     return this;
    //   },
    //   rmChild: function (c) { // Remover hijo específico
    //     this._e.removeChild(this._e.children[c - 1]);
    //   },

    //   rmAttr: function (a) { // Remueve un atributo
    //     this._e.removeAttribute(a);
    //     return this;
    //   },
    //   has: function (s) {
    //     return (new RegExp(s, 'g')).test(this._e.className);
    //   },
    //   attr: function (o) { // Agrega un atributo
    //     if (typeof o === 'object')
    //       Object.keys(o).forEach(v => { this._e.setAttribute(v, o[v]); });
    //     else if (typeof o == 'string')
    //       return this._e.getAttribute(o);

    //     return this;
    //   },
    //   insert: function (...a) { // appendChild
    //     a.forEach(v => { this._e.appendChild('_e' in v ? v._e : v); });
    //     return this;
    //   },


    //     return this;
    //   },


    //     return this;
    //   },
    //   val: function (v = '') { // Ingresar value
    //     if (v === '') {
    //       return v.value;
    //     } else {
    //       this._e.value = v;
    //       return this;
    //     }
    //   },

    //   get: function (p = 0) {
    //     return this._e.length !== undefined ? this._e[p] : this._e;
    //   }
    // }

  /* --------------------------------- Main Function --------------------------------- */
  // Recibe un string para buscar el elemento en el DOM y retornar un objeto
  // con todasl a funciones necesarias para ser usados sobre este proyecto
  const DOM = e => {
    // Revisar si ya se está usando el mismo elemento
    if (!isInPool(e)) {
      // Insertar en pool elementos seleccionados desde el DOM
      if (/^\./.test(e)) setPool(e, Array.from(document.getElementsByClassName(e.replace('.', ''))));
      else if (/^#/.test(e)) setPool(e, document.getElementById(e.replace('#', '')));
      else if (/^:/.test(e)) setPool(e, Array.from(document.getElementsByTagName(e.replace(':', ''))));
      else {
        e = e.id === '' ? `${e.tagName}-${Math.floor(Math.random() * 256)}` : e.id;
        setPool(`#${e.id}`, e);
      }

      registerListener(e, Object.assign({}, listeners));
    }

    return getListener(e);
  };

  const createFunc = e => {
    if (!isInPool(e)) {
      setPool(e, document.createElement(e));
      registerListener(e, Object.assign({}, listeners));
    }

    return getListener(e);
  };

  _.$ = DOM; // Manipular DOM
  _.$.create = createFunc; // Crear elementos

})(global);