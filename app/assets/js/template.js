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
      e = Array.from(document.getElementsByClassName(e.replace('.', '')))
    else if (/^#/.test(e)) // Por ID
      e = document.getElementById(e.replace('#', ''))
    else if (/^:/.test(e)) // Por el nombre del tag
      e = Array.from(document.getElementsByTagName(e.replace(':', '')))

    return {
      0: e,
      element: e, // Contendrá el elemento del DOM
      addClass: function (s) { // Agregar clases
        const rgx = new RegExp(s, 'g')
        if (!rgx.test(this.element.className))
          this.element.className += this.element.className === '' ? `${s}` : ` ${s}`

        return this
      },
      rmClass: function (c) { // Remover clases
        const rgx = new RegExp(c, 'g')
        if (rgx.test(this.element.className))
          this.element.className = this.element.className.replace(c.toString(), '').trim()
        return this
      },
      data: function (...s) { // Agregar o rescatar datos - dataset
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
      child: function (p) { // Buscar hijos
        return (p === 'all') ? Array.from(this.element.children) : this.element.children[p]
      },
      text: function (s = null) { // Agregar o remover texto - innerHTML
        if (s !== null) this.element.innerHTML = `${s}`
        else return this.element.textContent

        return this
      },
      // focus: function () { // Focus...necesario? depende la necesidad :).
      //   this.element.focus()
      //   return this
      // },
      rmAttr: function (a) { // Remueve un atributo
        this.element.removeAttribute(a)
        return this
      },
      has: function (s) {
        return (new RegExp(s, 'g')).test(this.element.className)
      },
      attr: function (o) { // Agrega un atributo
        if (typeof o === 'object')
          Object.keys(o).forEach(v => { this.element.setAttribute(v, o[v]) })
        else if (typeof o == 'string')
          return this.element.getAttribute(o)

        return this
      },
      insert: function (...a) { // appendChild
        a.forEach(v => { this.element.appendChild('element' in v ? v.element : v) })
        return this
      },
      css: function (s) { // Editar estilos css
        const rgx = new RegExp(s, 'g')
        if (!rgx.test(this.element.style.cssText))
          this.element.style.cssText += this.element.style.cssText === '' ? `${s}` : ` ${s}`

        return this
      },
      on: function (fn) { // Agrega eventos
        Object.keys(fn).forEach(v => {
          /animation/.test(v) ?
          this.element.addEventListener(v.toLowerCase(), fn[v]) :
          this.element[`on${v.toLowerCase()}`] = fn[v]
        })
        return this
      },
      val: function (v = '') { // Ingresar value
        this.element.value = v.toString()
        return this
      },
      each: function (fn) {
        this.element.forEach(fn)
        return this
      },
      get: function (p = 0) {
        return this.element[p]
      }
    }
  }

  _.$.clone = function clone(s, b = false) {
    return this((typeof s === 'string' ? document.createElement(s) : s.element).cloneNode(b))
  }
})(global)
