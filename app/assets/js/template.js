/**
 * -------------------------- Módulo template -------------------------- *
 *
 * Se ha desarrollado este módulo para no depender de jQuery.
 * No uso un patrón conocido como orientado a objetos. Pero funciona
 * bien para no repetir tanto código.
 */
module.exports = (function (_) {
  const o = Object.freeze({
    addClass,
    rmClass,
    getData,
    addText,
    getChild,
    setData,
    rmAttr,
    addTo,
    clone,
    attr,
    css,
    on
  })

  /**
   * Recibe un string para buscar el elemento en el DOM y retornar la función factory
   *
   * @var e {String} - Nombre del id o la clase por la cual buscar
   * @var obj {Object} - Objeto con los nombres de las funciones a ejecutar
   * @return factory {Function}
   */
  _.$ = function DOM (e, obj = {}) {
    if (/^\./.test(e)) e = Array.from(document.getElementsByClassName(e.replace('.', '')))
    else if (/^#/.test(e)) e = document.getElementById(e.replace('#', ''))
    else if (typeof e === 'object' && e.length > 0) e = e.map(v => document.createElement(v))
    if (e.length !== undefined) e = (e.length == 1 ? e[0] : e)
    return Object.keys(obj).length > 0 ? factory(e, obj) : e
  }

  /**
   * Recibe el elemento a usar y las funciones que se usarán sobre este
   *
   * @var e {Object} - Objeto del elemento html rescatado
   * @var obj {Object} - Objeto con los nombres de las funciones a ejecutar
   */
  function factory (e, obj) {
    const _obj = obj
    const k = Object.keys(_obj).shift()
    const v = _obj[k]
    // Cada vez que recorre el objeto con las funciones a usar
    // se borran las que que ya se usaron
    if (Object.keys(_obj).length >= 1) delete _obj[k]
    return o[k](e, v, _obj)
  }

  /* -------------------------- Funciones -------------------------- */
  function on (e, fn, o) {
    Object.keys(fn).forEach(v => {
      /animation/.test(v) ? e.addEventListener(v.toLowerCase(), fn[v]) : e[`on${v.toLowerCase()}`] = fn[v]
    })
    return Object.keys(o).length >= 1 ? factory(e, o) : e
  }

  function addText (e, t, o) {
    e.innerHTML = `${t}`
    return Object.keys(o).length >= 1 ? factory(e, o) : e
  }

  function addClass (e, c, o) {
    let rgx = new RegExp(c, 'g')
    if (!rgx.test(e.className)) e.className += e.className === '' ? `${c}` : ` ${c}`

    return Object.keys(o).length >= 1 ? factory(e, o) : e
  }

  function rmClass (e, c, o) {
    const rgx = new RegExp(c, 'g')
    if (rgx.test(e.className)) e.className = e.className.replace(c.toString(), '').trim()
    return Object.keys(o).length >= 1 ? factory(e, o) : e
  }

  function getChild (e, p, o) {
    e = (p === 'all') ? Array.from(e.children) : e.children[p]
    return Object.keys(o).length >= 1 ? factory(e, o) : e
  }

  function attr (e, a, o) {
    if (typeof a === 'object')
      for (let i = 0, size = a.length / 2; i < size; i++)
        e.setAttribute(a[(i + 1) * i], a[((i + 1) * i) + 1])
    else e = e.getAttribute(a)
    return Object.keys(o).length >= 1 ? factory(e, o) : e
  }

  function rmAttr (e, a, o) {
    e.removeAttribute(a)
    return Object.keys(o).length >= 1 ? factory(e, o) : e
  }

  function getData (e, d, o) {
    const data = e.dataset
    switch (d[1]) {
      case 'string': e = data[d[0]].toString(); break
      case 'int': e = parseInt(data[d[0]], 10); break
    }
    return Object.keys(o).length >= 1 ? factory(e, o) : e
  }

  function setData (e, d, o) {
    if (typeof d === 'object') {
      Object.keys(d).forEach(v => { e.dataset[v] = d[v] })
    } else {
      const k = Object.keys(d)[0]
      e.dataset[k] = d[k]
    }
    return Object.keys(o).length >= 1 ? factory(e, o) : e
  }

  function addTo (e, a, o) {
    a.forEach(v => { e.appendChild(v) })
    return Object.keys(o).length >= 1 ? factory(e, o) : e
  }

  function css (e, s, o) {
    e.style.cssText = s
    return Object.keys(o).length >= 1 ? factory(e, o) : e
  }

  function clone (e, v, o) {
    if (e.nodeName === v.toUpperCase()) e = e.cloneNode(false)
    return Object.keys(o).length >= 1 ? factory(e, o) : e
  }
})(global)
