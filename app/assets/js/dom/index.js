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

  /* --------------------------------- Events --------------------------------- */
  const event_ = {
    element: null,
    addClass: function(str) {
      let className = this.element.className.split(' ');

      if (className.indexOf(str) === -1) {
        className.push(str);
        this.element.className = className.join(' ');
      }

      return this;
    },
    empty: function() {
      let el = this.element;
      while(el.firstChild) el.removeChild(el.firstChild);

      return this;
    },
    text: function(str = null) {
      if (str === null) return this.element.textContent;

      return this.element.innerHTML = `${str}`, this;
    },
    removeClass: function(_class) {
      return this.element.className = this.element.className.replace(_class, '').trim(), this;
    },
    child: function(pos = -1) {
      return this.element = pos !== -1 ? this.element.children[pos] : Array.from(this.element.children),
      this;
    },
    on: function(fn) {
      // Select element is like an array because of the options elements inside
      if (this.element.length !== undefined && this.element.nodeName !== 'SELECT') {
        this.element.forEach(e => onFunction(e, fn));
      } else {
        onFunction(this.element, fn);
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
      let el = this.element;

      if (el.length !== undefined) {
        el.forEach(e => {
          if (e.style.cssText.indexOf(str)) e.style.cssText += `${str};`;
        });
      } else {
        if (el.style.cssText.indexOf(str)) el.style.cssText += `${str};`;
      }

      return this;
    },
    clone: function(isCloned) {
      if (typeof this.element === 'string') {
        return this.element = getCreatedElement(this.element).cloneNode(isCloned), this;
      } else {
        return event = Object.assign({}, event_),
        event.element = this.element.cloneNode(isCloned), event;
      }
    },
    get: function(pos = -1) {
      return pos === -1 ? this.element : this.element[pos];
    },
    rmAttr: function(attr) {
      return this.element.removeAttribute(attr), this;
    },
    attr: function (attr) {
      if (typeof attr === 'object')
        Object.keys(attr).forEach(v => { this.element.setAttribute(v, attr[v]); });
      else if (attr !== '')
        return this.element.getAttribute(attr);

      return this;
    },
    insert: function (...a) {
      a.forEach(v => { this.element.appendChild('element' in v ? v.element : v); });
      return this;
    },
    val: function (v = null) {
      return v === null ? this.element.value : this.element.value = v, this;
    },
    has: function (s) {
      return this.element.className.indexOf(s) !== -1;
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
      event.element = getElementInPool(e);
    } else {
      if ((r = /^(\.|#|:)/.exec(e))) {
        switch(r[0]) {
          case '.': e = Array.from(document.getElementsByClassName(e.slice(1, e.length))); break;
          case '#': e = document.getElementById(e.slice(1, e.length)); break;
          case ':': e = Array.from(document.getElementsByTagName(e.slice(1, e.length))); break;
        }

        saveElementInPool(e);
      } else if (typeof e === 'string') {
        saveCreatedElement(e);
      }
    }

    return event.element = e, event;
  }

  _.$ = dom;
})(global);