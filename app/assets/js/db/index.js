
let request = indexedDB.open('soube', 1)

let transaction
let dataToSave
let action
let db
let id

request.onupgradeneeded = function () {
    let upgrade = request.result
    upgrade.createObjectStore('music')
}

request.onsuccess = function (e) {
    db = request.result
}

function initTransaction() {
    if (action === 'add') {
        transaction = db.transaction('music', 'readwrite')
            .objectStore('music')
            .add({ buffer: dataToSave }, id)

        transaction.onsuccess = callback
    } else if (action === 'get') {
        transaction = db.transaction('music', 'readonly')
            .objectStore('music')
            .get(id)

        transaction.onsuccess = callback
    }
}

function setData(index, data, fn) {
    dataToSave = data
    callback = fn
    id = index
    initTransaction()
}

function getData(index, fn) {
    id = index
    callback = fn
    initTransaction()
}

module.exports = {
    setAction: function (_action) {
        action = _action
        return action === 'add' ? { setData } : { getData }
    }
}
