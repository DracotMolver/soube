/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
module.exports = (_ => {
  /* --------------------------------- Variables --------------------------------- */
  //---- normals ----
  let createdElements = {};
  let poolOfElements = {};
  let event = {};
  // let fragment = document.createDocumentFragment();
  let el;

  /* --------------------------------- Events --------------------------------- */
  const event_ = {
    element: null,
    switchClass: function (from, to) {
      return el = this.element, el.className = el.className.replace(from, to), this;
    },
    addClass: function (str) {
      const changeClassName = e => {
          let className = e.className.split(' ');

          if (className.indexOf(str) === -1) {
            className.push(str);
            e.className = className.join(' ');
          }
      };

      if (this.element.length) this.element.forEach(v => changeClassName(v));
      else changeClassName(this.element);

      return this;
    },
    empty: function() {
      el = this.element;
      while(el.firstChild) el.removeChild(el.firstChild);

      return this;
    },
    text: function (str = null) {
      el = this.element;
      if (str === null) return el.textContent;
      if (el.length) el.forEach(e => e.innerHTML = str);
      else el.innerHTML = str;

      return this;
    },
    removeClass: function (_class) {
      return el = this.element, el.className = el.className.replace(_class, '').trim(), this;
    },
    child: function(pos = -1) {
      return this.element = pos !== -1 ? this.element.children[pos] : Array.from(this.element.children),
      this;
    },
    on: function (fn) {
      el = this.element;
      // Select element is like an array because of the options elements inside
      if (el.length && el.nodeName !== 'SELECT') el.forEach(e => onFunction(e, fn));
      else onFunction(el, fn);

      return this;
    },
    rmEvent: function (...str) {
      return str.forEach(s => this.element[`on${s.toLowerCase()}`] = null), this;
    },
    data: function(data = null) {
      if (typeof data === 'string') {
        let d = this.element.dataset[data];
        return /^\d+$/.test(d) ? parseInt(d) : (/^\d+\.+\d+$/.test(d) ? parseFloat(d) : d.toString());
      } else {
        el = this.element;
        Object.keys(data).forEach(v => el.dataset[v] = data[v]);
      }

      return this;
    },
    each: function (fn) {
      return this.element.forEach((v, i) => fn.length === 1 ? fn(v) : fn(v, i)), this;
    },
    css: function (str) {
      el = this.element;
      const cssChange = e => {
        if (e.style.cssText.indexOf(str)) e.style.cssText += `${str};`;
      };

      if (el.length) el.forEach(e => cssChange(e));
      else cssChange(el);

      return this;
    },
    // clone: function(isCloned) {
    //   if (typeof this.element === 'string') {
    //     return this.element = getCreatedElement(this.element).cloneNode(isCloned), this;
    //   } else {
    //     return event = Object.assign({}, event_),
    //     event.element = this.element.cloneNode(isCloned), event;
    //   }
    // },
    get: function(pos = -1) {
      return pos === -1 ? this.element : this.element[pos];
    },
    rmAttr: function(attr) {
      return this.element.removeAttribute(attr), this;
    },
    attr: function (attr) {
      el = this.element;
      if (typeof attr === 'object') Object.keys(attr).forEach(v => el.setAttribute(v, attr[v]));
      else if (attr !== '') return el.getAttribute(attr);

      return this;
    },
    append: function (...a) {
      return el = this.element, a.forEach(v => el.appendChild('element' in v ? v.element : v)), this;
    },
    val: function (v = null) {
      return v === null ? this.element.value : this.element.value = v, this;
    },
    has: function (s) {
      return this.element.className.indexOf(s) !== -1;
    },
    cssValue: function () {
      return v = this.element.style.cssText,
        v.slice(0, v.length - 1).split(';').map(v => v.replace(/^[\w+\-]+\:\s+/g, ''));
    }
  };

  /* --------------------------------- Functions --------------------------------- */
  function onFunction (el, fn) {
    Object.keys(fn).forEach(v => {
      /animation/.test(v) ?
        el.addEventListener(v.toLowerCase(), fn[v]) :
        el[`on${v.toLowerCase()}`] = fn[v];
    })
  }

  // function saveCreatedElement(name) {
  //   if (!createdElements[name]) createdElements[name] = document.createElement(name);
  // }

  function getCreatedElement(name) {
    return !createdElements[name] ?
      (createdElements[name] = document.createElement(name), createdElements[name]) :
      createdElements[name].cloneNode(false);
  }

  function saveElementInPool(name, element) {
    poolOfElements[name] = element;
  }

  function inPool(name) {
    return poolOfElements[name] === event_.element;
  }

  function getElementInPool(name) {
    return poolOfElements[name];
  }

  /* --------------------------------- Main Function --------------------------------- */
  // Get an string to search for an element into the DOM and its return an Object
  // with all the needed functions
  const dom = e => {
    event = Object.assign({}, event_);

    if (inPool(e)) {
      return event.element = getElementInPool(e), event;
    } else {
      if ((r = /^(\.|#|:)/.exec(e))) {
        switch(r[0]) {
          case '.': e = Array.from(document.getElementsByClassName(e.slice(1, e.length))); break;
          case '#': e = document.getElementById(e.slice(1, e.length)); break;
          case ':': e = Array.from(document.getElementsByTagName(e.slice(1, e.length))); break;
        }

        saveElementInPool(e);
      }
      // else if (typeof e === 'string') {
      //   saveCreatedElement(e);
      // }
    }

    return event.element = e, event;
  }

  _.$ = dom;

  _.CreateElement = str => {
    return event = Object.assign({
      clone: function (deep = false) {
        return this.element = getCreatedElement(this.element.nodeName.toLowerCase()).cloneNode(deep), this;
      }
    }, event_), event.element = getCreatedElement(str.toLowerCase()), event;
  };
})(global);