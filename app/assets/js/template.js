/**
 * Framework pequeño para manipular el DOM
 * @author Diego Alberto Molina Vera
 */
module.exports = (_ => {
  /**
   * Recibe un string para buscar el elemento en el DOM y retornar un objeto
   * con todasl a funciones necesarias para ser usados sobre este proyecto
   *
   * @var e {String} - Nombre del id o la clase por la cual buscar
   * @return o {Object} - Objeto con las funciones
   */

  _.$ = e => {
    let _e = null;
    let _text = [];

    if (/^(\.|#|:)/.test(e)) {
      if (/^\./.test(e)) _e = Array.from(document.getElementsByClassName(e.replace('.', '')));
      else if (/^#/.test(e)) {
        _e = document.getElementById(e.replace('#', ''));
        _text.push(_e);
      }
      else if (/^:/.test(e)) _e = Array.from(document.getElementsByTagName(e.replace(':', '')));
    } else {
      _e = e;
      _text.push(_e);
    }

    return {
      _e,
      addClass: function (s) { // Agregar clases
        const rgx = new RegExp(s, 'g');
        const cName = this._e.className;
        if (!rgx.test(cName)) this._e.className += cName === '' ? `${s}` : ` ${s}`;
        return this;
      },
      rmClass: function (c) { // Remover clases
        const rgx = new RegExp(c, 'g');
        const cName = this._e.className;
        if (rgx.test(cName)) this._e.className = cName.replace(c, '').trim();
        return this;
      },
      data: function (...s) { // Agregar o rescatar datos - dataset
        // Verificar si se agregan o extraen datos - dataset
        if (s.length === 1) { // Agregar datos
          Object.keys(s[0]).forEach(v => { this._e.dataset[v] = s[0][v] });
          return this;
        } else { // Extraer datos
          switch (s[1]) {
            case 'string': return this._e.dataset[s[0]].toString();
            case 'int': return parseInt(this._e.dataset[s[0]], 10);
          }
        }
      },
      child: function (p = 'all') { // Buscar hijos
        this._e = (p !== 'all' && typeof p === 'number') ? this._e.children[p] : Array.from(this._e.children);
        return this;
      },
      rmChild: function (c) { // Remover hijo específico
        this._e.removeChild(this._e.children[c - 1]);
      },
      text: function (s = null) { // Agregar o devolver texto - innerHTML
        if (s !== null) this._e.innerHTML = `${s}`;
        else return this._e.textContent;
        return this;
      },
      rmAttr: function (a) { // Remueve un atributo
        this._e.removeAttribute(a);
        return this;
      },
      has: function (s) {
        return (new RegExp(s, 'g')).test(this._e.className);
      },
      attr: function (o) { // Agrega un atributo
        if (typeof o === 'object')
          Object.keys(o).forEach(v => { this._e.setAttribute(v, o[v]); });
        else if (typeof o == 'string')
          return this._e.getAttribute(o);

        return this;
      },
      insert: function (...a) { // appendChild
        a.forEach(v => { this._e.appendChild('_e' in v ? v._e : v); });
        return this;
      },
      css: function (s) { // Editar estilos css
        const rgx = new RegExp(s, 'g');
        let cssText = null;
        if (this._e.length !== undefined) {
          this._e.forEach(e => {
            cssText = e.style;
            if (!rgx.test()) cssText.cssText += cssText.cssText === '' ? `${s}` : ` ${s}`;
          });
        } else {
            cssText = this._e.style;
            if (!rgx.test()) cssText.cssText += cssText.cssText === '' ? `${s}` : ` ${s}`;
        }

        return this;
      },
      on: function (fn) { // Agrega eventos
        if (this._e.length !== undefined) {
          this._e.forEach(e => {
            Object.keys(fn).forEach(v => {
              /animation/.test(v) ?
              e.addEventListener(v.toLowerCase(), fn[v]) :
              e[`on${v.toLowerCase()}`] = fn[v];
            });
          });
        } else {
          Object.keys(fn).forEach(v => {
            /animation/.test(v) ?
            this._e.addEventListener(v.toLowerCase(), fn[v]) :
            this._e[`on${v.toLowerCase()}`] = fn[v];
          });
        }

        return this;
      },
      val: function (v = '') { // Ingresar value
        if (v === '') {
          return v.value;
        } else {
          this._e.value = v;
          return this;
        }
      },
      each: function (fn) {
        let _self = Object.assign({}, this);
        for (var i = 0, size = this._e.length; i < size; i++) {
          _self._e = this._e[i];
          fn.length === 1 ? fn(_self) : fn(_self, i);
        }

        return this;
      },
      get: function (p = 0) {
        return this._e.length !== undefined ? this._e[p] : this._e;
      }
    }
  };

  const cloneFunc = function clone(s, b = false) {
    return this((typeof s === 'string' ? document.createElement(s) : s.get()).cloneNode(b));
  };
  _.$.clone = cloneFunc;
})(global);