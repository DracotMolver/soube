/**
 * Framework pequeño para manipular el DOM
 * @author Diego Alberto Molina Vera
 */
module.exports = (_ => {
  /* --------------------------------- Variables --------------------------------- */
  var createdElements = {};
  var poolOfElements = {};

  /* --------------------------------- Eventos --------------------------------- */
  const Event = {
    element: null,
    addClass: str => {
      const rgx = new RegExp(str, 'g');
      const cName = Event.element.className;

      if (!rgx.test(cName)) Event.element.className += cName === '' ? `${str}` : ` ${str}`;

      return Event;
    },
    text: (str = '') => {
      if (str !== '') Event.element.innerHTML = `${str}`;
      else return Event.element.textContent;

      return Event;
    },
    replaceClass: (from, to) => {
      Event.element.className = Event.element.className.replace(from, to);
      return Event;
    },
    child: (pos = -1) => {
      if (pos !== -1) Event.element = Event.element.children[pos];
      else Event.element = Array.from(Event.element.children[0]);

      return Event;
    },
    on: fn => {
      if (Event.element.length !== undefined) {
        Event.element.forEach(e => {
          Object.keys(fn).forEach(v => {
            /animation/.test(v) ?
              e.addEventListener(v.toLowerCase(), fn[v]) :
              e[`on${v.toLowerCase()}`] = fn[v];
          });
        });
      } else {
        Object.keys(fn).forEach(v => {
          /animation/.test(v) ?
            Event.element.addEventListener(v.toLowerCase(), fn[v]) :
            Event.element[`on${v.toLowerCase()}`] = fn[v];
        });
      }

      return Event;
    },
    data: (data = null) => {
      if (data !== null) {
        let d = Event.element.dataset[data];
        if (/^\d+$/.test(d)) return parseInt(d);
        else if (/^\d+(\.+)\d+$/.test(d)) return parseFloat(d);
        else if (/^(\w|\s)+$/.test(d)) return d.toString();
      } else {
        Object.keys(data[0]).forEach(v => {
          Event.element.dataset[v] = data[v];
        });
      }

      return Event;
    },
    each: fn => {
      Event.element.forEach((v, i) => {
      fn.length === 1 ? fn(v) : fn(v, i);
      });

      return Event;
    },
    css: str => {
      const rgx = new RegExp(str, 'g');
      let el = Event.element;

      if (el.length !== undefined) {
        el.forEach(e => {
          if (!rgx.test(e.style.cssText)) e.style.cssText += e.style.cssText === '' ? `${str};` : ` ${str};`;
        });
      } else {
        if (!rgx.test(el.style.cssText)) el.style.cssText += el.style.cssText === '' ? `${str};` : ` ${str};`;
      }

      return Event;
    },
    clone: (name, isCloned) => {
      Event.element = getCreatedElement(name).cloneNode(isCloned);
      return Event;
    },
    get: () => Event.element,
    rmAttr: attr => {
      Event.element.removeAttribute(attr);
      return Event;
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
//   //   attr: function (o) { // Agrega un atributo
//   //     if (typeof o === 'object')
//   //       Object.keys(o).forEach(v => { this._e.setAttribute(v, o[v]); });
//   //     else if (typeof o == 'string')
//   //       return this._e.getAttribute(o);
//   //     return this;
//   //   },
//   //   insert: function (...a) { // appendChild
//   //     a.forEach(v => { this._e.appendChild('_e' in v ? v._e : v); });
//   //     return this;
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
    // Revisar si ya se está usando el mismo elemento
    // De no existir se crea, pero solo una vez.
    if (inPool(e)) {
      Event.element = getElementInPool(e);
      return Event;
    } else {
      // Insertar en pool elementos seleccionados desde el DOM
      if (/^\./.test(e)) e = Array.from(document.getElementsByClassName(e.replace('.', '')));
      else if (/^#/.test(e)) e = document.getElementById(e.replace('#', ''));
      else if (/^:/.test(e)) e = Array.from(document.getElementsByTagName(e.replace(':', '')));
      else if (typeof e !== 'object') saveCreatedElement(e);

      Event.element = e;
    }

    return Event;
  }

  _.$ = DOM; // Manipular DOM
})(global);