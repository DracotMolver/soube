/**
 * -------------------------- Módulo template -------------------------- *
 * Framework pequeño para manipular el DOM
 * @author Diego Alberto Molina Vera
 */
module.exports = (function (_) {
  const createdElements = {
    div: document.createElement('div')
  }
  /**
   * Recibe un string para buscar el elemento en el DOM y retornar un objeto
   * con todasl a funciones necesarias para ser usados sobre este proyecto
   *
   * @var e {String} - Nombre del id o la clase por la cual buscar
   * @return o {Object} - Objeto con las funciones
   */
  _.$ = function DOM(e) {
    if (/^\./.test(e)) // Por Clases
      e = Array.from(document.getElementsByClassName(e.replace('.', '')))
    else if (/^#/.test(e)) // Por ID
      e = document.getElementById(e.replace('#', ''))

    return {
      element: e,
      // Agregar o remover clases
      addClass: function (s) {
        const rgx = new RegExp(s, 'g')
        if (!rgx.test(this.className))
          this.element.className += this.element.className === '' ? `${s}` : ` ${s}`

        return this
      },
      rmClass: function (c) {
        const rgx = new RegExp(c, 'g')
        if (rgx.test(this.element.className))
          this.element.className = this.element.className.replace(c.toString(), '').trim()
        return this
      },
      // Agregar o rescatar datos - dataset
      data: function (...s) {
        // Verificar si se agregan o extraen datos - dataset
        if (s.length === 1) { // Agregar datos
          Object.keys(s[0]).forEach(v => { this.element.dataset[v] = s[0][v] })
          return this
        } else { // Extraer datos
          switch (s[1]) {
            case 'string': return this.element.dataset[s[0]].toString()
            case 'int': return parseInt(this.element.dataset[s[0]], 10)
          }
        }
      },
      // Buscar hijos
      child: function (p) {
        return (p === 'all') ? Array.from(this.element.children) : this.element.children[p]
      },
      // Agregar o remover texto - innerHTML
      text: function (s = null) {
        if (s !== null) this.element.innerHTML = `${s}`
        else return this.element.textContent

        return this
      },
      // Focus...necesario? depende la utilidad.
      focus: function () {
        this.element.focus()
        return this
      },
      // Agregar/retornar o remover atributo
      rmAttr: function (a) {
        this.element.removeAttribute(a)
        return this
      },
      attr: function (o) {
        if (typeof o === 'object')
          Object.keys(o).forEach(v => {/**/ this.element.setAttribute(v, o[v]) })
        else if (typeof o == 'string')
          return this.element.getAttribute(o)

        return this
      },
      // appendChild
      insert: function (...a) {
        a.forEach(v => { this.element.appendChild('element' in v ? v.element : v) })
        return this
      },
      // Editar estilos css
      css: function (s) {
        this.element.style.cssText = s
        return this
      },
      // Agregar funciones
      on: function (fn) {
        Object.keys(fn).forEach(v => {
          /animation/.test(v) ?
            this.element.addEventListener(v.toLowerCase(), fn[v]) :
            this.element[`on${v.toLowerCase()}`] = fn[v]
        })
        return this
      }
    }
  }

  _.$.clone = function clone(s, b = false) {
    return this(
      (typeof s === 'string' ? createdElements[s] : s.element)
        .cloneNode(b)
    )
  }
})(global)
