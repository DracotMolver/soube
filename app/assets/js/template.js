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
    if (/^\./.test(e)) // Por Clases
      e = Array.from(document.getElementsByClassName(e.replace('.', '')));
    else if (/^#/.test(e)) // Por ID
      e = document.getElementById(e.replace('#', ''));
    else if (/^:/.test(e)) // Por el nombre del tag
      e = Array.from(document.getElementsByTagName(e.replace(':', '')));

    return {
      0: e,
      element: e, // Contendrá el elemento del DOM
      addClass: function (s) { // Agregar clases
        const rgx = new RegExp(s, 'g');
        if (!rgx.test(this.element.className))
          this.element.className += this.element.className === '' ? `${s}` : ` ${s}`;

        return this;
      },
      rmClass: function (c) { // Remover clases
        const rgx = new RegExp(c, 'g');
        if (rgx.test(this.element.className))
          this.element.className = this.element.className.replace(c.toString(), '').trim();

        return this;
      },
      data: function (...s) { // Agregar o rescatar datos - dataset
        // Verificar si se agregan o extraen datos - dataset
        if (s.length === 1) { // Agregar datos
          Object.keys(s[0]).forEach(v => { this.element.dataset[v] = s[0][v] });
          return this;
        } else { // Extraer datos
          switch (s[1]) {
            case 'string': return this.element.dataset[s[0]].toString()
            case 'int': return parseInt(this.element.dataset[s[0]], 10)
          }
        }
      },
      child: function (p = 'all') { // Buscar hijos
        this[0] = this.element = (p !== 'all' && typeof p === 'number') ?
        this.element.children[p] : Array.from(this.element.children);
        return this;
      },
      rmChild: function (c) { // Remover hijo específico
        const ch = this.element.children[c - 1];
        this.element.removeChild(ch);
      },
      text: function (s = null) { // Agregar o remover texto - innerHTML
        if (this.element.length !== undefined) {
          this.element.forEach(v => {
            v.innerHTML = `${s}`;
          });
        } else {
          if (s !== null) this.element.innerHTML = `${s}`;
          else return this.element.textContent;
        }

        return this;
      },
      rmAttr: function (a) { // Remueve un atributo
        this.element.removeAttribute(a);
        return this;
      },
      has: function (s) {
        return (new RegExp(s, 'g')).test(this.element.className);
      },
      attr: function (o) { // Agrega un atributo
        if (typeof o === 'object')
          Object.keys(o).forEach(v => { this.element.setAttribute(v, o[v]); });
        else if (typeof o == 'string')
          return this.element.getAttribute(o);

        return this;
      },
      insert: function (...a) { // appendChild
        a.forEach(v => { this.element.appendChild('element' in v ? v.element : v); });
        return this;
      },
      css: function (s) { // Editar estilos css
        const rgx = new RegExp(s, 'g');
        let cssText = this.element.style;
        if (!rgx.test()) cssText.cssText += cssText.cssText === '' ? `${s}` : ` ${s}`;

        return this;
      },
      on: function (fn) { // Agrega eventos
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
      val: function (v = '') { // Ingresar value
        this.element.value = v.toString();
        return this;
      },
      each: function (fn) {
        let _self = Object.assign({}, this);
        for (var i = 0, size = this.element.length; i < size; i++) {
          _self[0] = this.element[i];
          _self.element = this.element[i];

          if (fn.length === 1) fn(_self);
          else if (fn.length === 2) fn(_self, i);
        }

        return this;
      },
      get: function (p = 0) { return this.element[p]; }
    }
  };

  const cloneFunc = function clone(s, b = false) {
    return this((typeof s === 'string' ? document.createElement(s) : s.element).cloneNode(b));
  };
  _.$.clone = cloneFunc
})(global);
