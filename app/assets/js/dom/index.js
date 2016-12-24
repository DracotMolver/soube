/**
 * Framework pequeño para manipular el DOM
 * @author Diego Alberto Molina Vera
 */
module.exports = (_ => {
  /* --------------------------------- Variables --------------------------------- */
  var createdElements = {};
  var poolOfElements = {};
  var event = {};

  /* --------------------------------- Eventos --------------------------------- */
  const Event = {
    element: null,
    addClass: function(str) {
      const rgx = new RegExp(str, 'g');
      const cName = this.element.className;

      if (!rgx.test(cName)) this.element.className += cName === '' ? `${str}` : ` ${str}`;

      return this;
    },
    text: function(str = '') {
      if (str !== '') this.element.innerHTML = `${str}`;
      else return this.element.textContent;

      return this;
    },
    replaceClass: function(from, to) {
      this.element.className = this.element.className.replace(from, to);
      return this;
    },
    child: function(pos = -1) {
      if (pos !== -1) this.element = this.element.children[pos];
      else this.element = Array.from(this.element.children[0]);

      return this;
    },
    on: function(fn) {
      if (this.element.length !== undefined) {
        this.element.forEach(e => {
          Object.keys(fn).forEach(v => {
            /animation/.test(v) ?
              e.addEventListener(v.toLowerCase(), fn[v]) :
              e[`on${v.toLowerCase()}`] = fn[v];
          });
        });
      } else {
        Object.keys(fn).forEach(v => {
          /animation/.test(v) ?
            this.element.addEventListener(v.toLowerCase(), fn[v]) :
            this.element[`on${v.toLowerCase()}`] = fn[v];
        });
      }

      return this;
    },
    data: function(data = null) {
      if (typeof data === 'string') {
        let d = this.element.dataset[data];
        if (/^\d+$/.test(d)) return parseInt(d);
        else if (/^\d+(\.+)\d+$/.test(d)) return parseFloat(d);
        else if (/^(\w|\s)+$/.test(d)) return d.toString();
      } else {
        Object.keys(data).forEach(v => {
          this.element.dataset[v] = data[v];
        });
      }

      return this;
    },
    each: function(fn) {
      this.element.forEach((v, i) => {
      fn.length === 1 ? fn(v) : fn(v, i);
      });

      return this;
    },
    css: function(str) {
      const rgx = new RegExp(str, 'g');
      let el = this.element;

      if (el.length !== undefined) {
        el.forEach(e => {
          if (!rgx.test(e.style.cssText)) e.style.cssText += e.style.cssText === '' ? `${str};` : ` ${str};`;
        });
      } else {
        if (!rgx.test(el.style.cssText)) el.style.cssText += el.style.cssText === '' ? `${str};` : ` ${str};`;
      }

      return this;
    },
    clone: function(isCloned) {
      if (typeof this.element === 'string') {
        this.element = getCreatedElement(this.element).cloneNode(isCloned);
        return this;
      } else {
        event = Object.assign({}, Event);
        event.element = this.element.cloneNode(isCloned);
        return event;
      }
    },
    get: function(pos = -1) {
      return pos === -1 ? this.element : this.element[pos];
    },
    rmAttr: function(attr) {
      this.element.removeAttribute(attr);
      return this;
    },
    attr: function (attr) {
      if (typeof attr === 'object')
        Object.keys(attr).forEach(v => { this.element.setAttribute(v, attr[v]); });
      else
        return this.element.getAttribute(attr);

      return this;
    },
    insert: function (...a) {
      a.forEach(v => { this.element.appendChild('element' in v ? v.element : v); });
      return this;
    }
  };

  /* --------------------------------- Funciones --------------------------------- */
  function saveCreatedElement(name) {
    if (!createdElements[name]) createdElements[name] = document.createElement(name);
  }

  function getCreatedElement(name) {
    return createdElements[name];
  }

  function saveElementInPool(name, element) {
    poolOfElements[name] = element;
  }

  function inPool(name) {
    return poolOfElements[name] === Event.element;
  }

  function getElementInPool(name) {
    return poolOfElements[name];
  }

//   //   rmChild: function (c) { // Remover hijo específico
//   //     this._e.removeChild(this._e.children[c - 1]);
//   //   },

//   //   has: function (s) {
//   //     return (new RegExp(s, 'g')).test(this._e.className);
//   //   },
//   //   val: function (v = '') { // Ingresar value
//   //     if (v === '') {
//   //       return v.value;
//   //     } else {
//   //       this._e.value = v;
//   //       return this;
//   //     }
//   //   },
//   // }

  /* --------------------------------- Main Function --------------------------------- */
  // Recibe un string para buscar el elemento en el DOM y retornar un objeto
  // con todas las funciones necesarias para ser usados sobre este proyecto
  const DOM = e => {
    event = Object.assign({}, Event);

    // Revisar si ya se está usando el mismo elemento
    // De no existir se crea, pero solo una vez.
    if (inPool(e)) {
      event.element = getElementInPool(e);
    } else {
      // Insertar en pool elementos seleccionados desde el DOM
      if (/^\./.test(e)) {
        e = Array.from(document.getElementsByClassName(e.replace('.', '')));
        saveElementInPool(e);
      } else if (/^#/.test(e)) {
        e = document.getElementById(e.replace('#', ''));
        saveElementInPool(e);
      } else if (/^:/.test(e)) {
        e = Array.from(document.getElementsByTagName(e.replace(':', '')));
        saveElementInPool(e);
      } else if (typeof e === 'string') {
        saveCreatedElement(e);
      } else {
      }
    }

    event.element = e;
    return event;
  }

  _.$ = DOM; // Manipular DOM
})(global);