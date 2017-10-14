/**
 * @module assets/main.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Variables --------------------------------- */
let poolOfElements = {}
let key = ''
let e

/* --------------------------------- Functions --------------------------------- */
function onFunction(el, fn) {
    Object.keys(fn).forEach(v => v.includes('animation')
        ? el.addEventListener(v.toLowerCase(), fn[v].bind(null, el), { passive: true })
        : el[`on${v.toLowerCase()}`] = fn[v].bind(null, el))
}

function setElementInPool(name, element) {
    poolOfElements[name] = element
}

function inPool(name) {
    return poolOfElements[name] !== undefined
}

function getElementInPool(name) {
    return poolOfElements[name]
}

/* --------------------------------- Class --------------------------------- */
const obj = {
    element: null,
    switchClass(el, classes) {
        el.classList.remove(classes[0]), el.classList.add(classes[1])
    },
    addClass(el, str) {
        el.length
            ? el.forEach(v => v.classList.add(...str.split(' ')))
            : el.classList.add(...str.split(' '))
    },
    rmChild(el, c) {
        console.log('rmChild() - dom', c);
        // return el = this.element, el.removeChild(Array.from(el.children).find(v => (new RegExp(c)).test(v.outerHTML))), this
    },
    empty(el) {
        while (el.firstChild) el.removeChild(el.firstChild)
    },
    text(el, str = null) {
        str !== null ? (el.length ? el.forEach(e => e.innerHTML = str) : el.innerHTML = str) : e = el.textContent
    },
    removeClass(el, _class) {
        el.classList.remove(_class)
    },
    child(el, pos) {
        e = pos >= 0 ? el.children[pos] : Array.from(el.children)
    },
    lastChild(el) {
        e = el.lastChild
    },
    on(el, fn) {
        el.length && el.nodeName !== 'SELECT'
            ? el.forEach(e => onFunction(e, fn))
            : onFunction(el, fn)
    },
    data(el, data) {
        if (data.constructor === String) {
            let d = el.dataset[data]

            e = /^\d+$/.test(d)
                ? parseInt(d)
                : (/^\d+\.\d+$/.test(d)
                    ? parseFloat(d)
                    : d.toString())
        } else {
            Object.keys(data).forEach(v => el.dataset[v] = data[v])
        }
    },
    each(el, fn) {
        el.forEach((v, i) => fn.length === 1 ? fn(v) : fn(v, i))
    },
    css(el, str, replace) {
        const cssChange = e => {
            if (e.style.cssText.indexOf(str) && !replace)
                e.style.cssText += `${str};`
            else if (replace !== '')
                e.style.cssText = `${str};`
        }

        el.length ? el.forEach(e => cssChange(e)) : cssChange(el)
    },
    rmAttr(el, attr) {
        el.removeAttribute(attr)
    },
    attr(el, attr) {
        if (attr.constructor === Object)
            Object.keys(attr).forEach(v => el.setAttribute(v, attr[v].toString()))
        else if (attr)
            e = el.getAttribute(attr)
    },
    append(el, a) {
        const add = (e, v) => e.appendChild('element' in v ? v.element : v)

        if (a.constructor === Array) {
            let f = document.createDocumentFragment()
            a.forEach(v => f.appendChild(v))
            add(el, f)
        } else {
            add(el, a)
        }
    },
    clearVal(el) {
        el.value = ''
    },
    val(el, v) {
        v ? el.value = v : e = el.value
    },
    has(el, s) {
        e = el.classList.contains(s)
    },
    cssValue(el, v) {
        e = window.getComputedStyle(el).getPropertyValue(v).replace(/em|px|%/g, '')
    },
    objSize(obj) {
        let i
        let size = 0

        for (i in obj)++size

        return size
    }
}

function $(_e, prop) {
    e = _e
    if (/^@/.test(e)) {
        e = obj[e.slice(1)]
    } else {
        if ((r = /^(\.|#|:)/.exec(e))) {
            key = e
            switch (r[0]) {
                case '.': e = Array.from(document.getElementsByClassName(e.slice(1))); break
                case '#': e = document.getElementById(e.slice(1)); break
                case ':': e = Array.from(document.getElementsByTagName(e.slice(1))); break
            }
        }
        if (prop) Object.keys(prop).forEach(k => obj[k].call(null, e, prop[k]))
    }
    return e
}

function create(el, prop) {
    let e = inPool(el) ? getElementInPool(e).cloneNode(false) : document.createElement(el)
    Object.keys(prop).forEach(k => obj[k].call(null, e, prop[k]))
    return e
}

module.exports = { $, create }
