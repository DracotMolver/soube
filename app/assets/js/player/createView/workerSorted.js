/**
 * @module player/createView/workerSorted.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * It will make an expensive taks of sorting the list of songs
 */

/** -=================================== Function ===================================- **/
/**
 * Sort all the extracted song files based on the song title
 * @returns {array} - A new array holding the sorted songs
 */
function setAlphabeticOrder(type, listSongs) {
    let _a = ''
    let _b = ''

    return listSongs.map(v => Object.create(v)).sort((a, b) =>
        (_a = a[type].toLowerCase().normalize('NFC'),
        _b = b[type].toLowerCase().normalize('NFC'),
        _a < _b ? -1 : _a > _b)
    )
}

this.onmessage = e => {
    switch (e.data.type) {
        case 'title':
            let _t = setAlphabeticOrder(e.data.type, e.data.listSongs)
                .map(v => ({title: v.title, position: v.position }))
            postMessage({
                title: _t,
                type: 'title'
            })
            break
        case 'artist':
            let _a = [...new Set(setAlphabeticOrder(e.data.type, e.data.listSongs).map(a => a.artist))]
            postMessage({
                artist: _a,
                type: 'artist'
            })
            break
        case 'album':
            let _b = [...new Set(setAlphabeticOrder(e.data.type, e.data.listSongs).map(a => a.album))]
            postMessage({
                album: _b,
                type: 'album'
            })
    }
}
