/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Variables --------------------------------- */
let poolOfElements = {};
let key = '';

/* --------------------------------- Functions --------------------------------- */
function onFunction(el, fn) {
  Object.keys(fn).forEach(function (v) {
    /animation/.test(v) ?
      el.addEventListener(v.toLowerCase(), fn[v]) :
      el[`on${v.toLowerCase()}`] = fn[v];
  });
}

function saveElementInPool(name, element) {
  poolOfElements[name] = element;
}

function inPool(name) {
  return poolOfElements[name] !== undefined;
}

function getElementInPool(name) {
  return poolOfElements[name];
}

/* --------------------------------- Class --------------------------------- */
const _ = function () { };

_.prototype = {
  element: null,
  switchClass: function (from, to) {
    return el = this.element, el.className = el.className.replace(from, to), this;
  },
  addClass: function (str) {
    const changeClassName = function (e) {
      let className = e.className.trim().split(' ');
      if (className.indexOf(str) === -1) {
        className.push(str);
        e.className = className.join(' ').trim();
      }
    };

    return this.element.length ?
      this.element.forEach(function (v) { changeClassName(v); }) : changeClassName(this.element), this;
  },
  rmChild: function (c) {
    return el = this.element, el.removeChild(Array.from(el.children).find(function (v) { return (new RegExp(c)).test(v.outerHTML) })), this;
  },
  empty: function () {
    el = this.element;
    while (el.firstChild) el.removeChild(el.firstChild);

    return this;
  },
  text: function (str = null) {
    el = this.element;
    return str !== null ?
      (el.length ? el.forEach(function (e) { e.innerHTML = str; }) : el.innerHTML = str, this) : el.textContent;
  },
  removeClass: function (_class) {
    return el = this.element, el.className = el.className.replace(_class, '').trim(), this;
  },
  child: function (pos = -1) {
    return this.element = pos !== -1 ? this.element.children[pos] : Array.from(this.element.children), this;
  },
  lastChild: function () {
    return this.element = this.element.lastChild, this;
  },
  on: function (fn) {
    el = this.element;
    return el.length && el.nodeName !== 'SELECT' ?
      el.forEach(function (e) { onFunction(e, fn); }) : onFunction(el, fn), this;
  },
  data: function (data = null) {
    return data.constructor === String ?
      (d = this.element.dataset[data], /^\d+$/.test(d) ?
        parseInt(d) : (/^\d+\.+\d+$/.test(d) ?
          parseFloat(d) : d.toString()
        )
      ) : (el = this.element, Object.keys(data).forEach(function (v) { el.dataset[v] = data[v]; }), this);
  },
  each: function (fn) {
    return this.element.forEach(function (v, i) { fn.length === 1 ? fn(v) : fn(v, i); }), this;
  },
  css: function (str) {
    el = this.element;
    const cssChange = function (e) {
      if (e.style.cssText.indexOf(str))
        e.style.cssText += `${str};`;
    };

    return el.length ?
      el.forEach(function (e) { cssChange(e); }) : cssChange(el), this;
  },
  get: function (pos = -1) {
    return pos === -1 ? this.element : this.element[pos];
  },
  rmAttr: function (attr) {
    return this.element.removeAttribute(attr), this;
  },
  attr: function (attr) {
    el = this.element;
    if (attr.constructor === Object)
      Object.keys(attr).forEach(function (v) { el.setAttribute(v, attr[v]); });
    else if (attr !== '')
      return el.getAttribute(attr);

    return this;
  },
  append: function (a, pos = []) {
    let _a = [];
    _a.push(a);

    return el = this.element, _a.forEach(function (v) {
      if (pos.length) {
        switch (pos[0]) {
          case 'before': el.insertBefore('element' in v ? v.element : v, pos[1]); break;
        }
      } else {
        el.appendChild('element' in v ? v.element : v);
      }
    }), this;
  },
  val: function (v = null) {
    return v === null ? this.element.value : (this.element.value = v, this);
  },
  has: function (s) {
    return this.element.className.indexOf(s) !== -1;
  },
  cssValue: function () {
    return v = this.element.style.cssText,
      v.slice(0, v.length - 1).split(';').map(function (v) { return v.replace(/^[\w+\-]+\:\s+/g, ''); });
  }
};

function $(e) {
  const obj = Object.create(_.prototype);

  if (inPool(e)) {
    return obj.element = getElementInPool(e), obj;
  } else {
    if ((r = /^(\.|#|:)/.exec(e))) {
      key = e;
      switch (r[0]) {
        case '.': e = Array.from(document.getElementsByClassName(e.slice(1, e.length))); break;
        case '#': e = document.getElementById(e.slice(1, e.length)); break;
        case ':': e = Array.from(document.getElementsByTagName(e.slice(1, e.length))); break;
      }

      saveElementInPool(key, e);
    }
  }

  return obj.element = e, obj;
}

module.exports = $;