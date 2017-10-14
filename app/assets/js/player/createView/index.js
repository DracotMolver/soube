/**
 * @module createView/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * It will create by default the music player view. It Also, it creates the album view.
 *
 * The list view is to play all the songs avialable from the folder we've loaded.
 * The album view is to play only the songs from the album (one folder) we've loaded.
 * The album view is not permantly. by the other hand the list view is by default.
 */
/** -=================================== Modules ===================================- **/
// ---- Electron ----
const path = require('path')

// ---- Own ----
const {
    configFile,
    listSongs,
    langFile
} = require(path.join(__dirname, '../../', 'config')).init()
const worker = new Worker(path.join(__dirname, 'workerSorted.js'))
const { $, create } = require(path.join(__dirname, '../../', 'dom'))
const search = require(path.join(__dirname, '../', 'search'))

/** -=================================== Functions ===================================- **/
/**
 * It will play the songs from the music player or the album bie
 *
 * @param {HTMLElement} _t - The element from where the event has been triggerd
 * @param {object} player - The instance of the player
 */
function playSong(player, el) {
    // It's needed to passed the player instance because we need to know
    // if the song is gonna be played from the list of song or from the album view
    player.getMediaControl(player.mediaControl()).playSongAtPosition($(el, { data: 'position' }))
}

/**
 * It replaces &nbps to whitespace
 * @param {string} value - Any string to be cleaned
 * @return {string} A new string with whitespace instead &nbps 
 */
function nbspToSpace(value) {
    return value.replace(/&nbsp;/g, ' ')
}

/**
 * It will create and render the list of songs
 *
 * @param {object} player - The instance of the player
 */
function createView(player) {
    const lang = langFile[configFile.lang]
    let f = document.createDocumentFragment()
    let actualArtist = ''
    let actualAlbum = ''

    // Building the basic structure of elements.
    listSongs.forEach((v, i) => {
        f.appendChild(
            create('div', {
                addClass: 'list-song-container grid-100 grid-parent',
                attr: {
                    id: i,
                    title: `${nbspToSpace(v.title)} by ${nbspToSpace(v.artist)} from ${nbspToSpace(v.album)}`
                },
                text: `<div class="grid-33 mobile-grid-33 song-info">${v.title}</div>
                        <div ${actualArtist !== v.artist ? `id="${v.artist, actualArtist = v.artist}"` : ''} class="grid-33 mobile-grid-33 song-info">
                            <span class="miscelaneo">by</span>
                            ${v.artist}
                        </div>
                        <div ${actualAlbum !== v.album ? `id="${v.album, actualAlbum = v.album}"` : ''} class="grid-33 mobile-grid-33 song-info">
                            <span class="miscelaneo">from</span>
                            ${v.album}
                        </div>`,
                data: {
                    position: i,
                    artist: v.artist,
                    title: v.title,
                    album: v.album
                },
                on: {
                    click: playSong.bind(null, player)
                }
            })
        )
    })
    $('#list-songs', { append: f })

    // Add the artist, album and song name to the filters
    let child = $('#filter-container', { child() { } })

    // Song filter
    worker.postMessage({
        type: 'title',
        listSongs
    })
    // Artist filter
    worker.postMessage({
        type: 'artist',
        listSongs
    })
    // Album filter
    worker.postMessage({
        type: 'album',
        listSongs
    })

    worker.onmessage = e => {
        switch (e.data.type) {
            case 'title':
                f = document.createDocumentFragment()
                f.appendChild(create('option', {
                    val: 'all',
                    text: lang.filterBy.title
                }))
                e.data.title.forEach(t => f.appendChild(create('option', {
                    val: t.position,
                    text: t.title
                })))
                $(child[0], {
                    append: [
                        create('select', {
                            addClass: 'grid-90 mobile-grid-85 grid-parent',
                            append: f,
                            on: { click: search.filterBy.bind(null, 'title', player) }
                        }),
                        create('div', {
                            addClass: 'grid-10 mobile-grid-15 grid-parent order-by',
                            css: 'text-align:center',
                            text: '&#9660;',
                            data: {
                                by: 'down'
                            },
                            on: { click: search.orderBy.bind(null, 'title') }
                        })
                    ]
                })
                break
            case 'artist':
                f = document.createDocumentFragment()
                f.appendChild(create('option', {
                    val: 'all',
                    text: lang.filterBy.artist
                }))
                e.data.artist.forEach(a => f.appendChild(create('option', {
                    val: a,
                    text: a
                })))
                $(child[1], {
                    append: [
                        create('select', {
                            addClass: 'grid-90 mobile-grid-85 grid-parent',
                            append: f,
                            on: { click: search.filterBy.bind(null, 'artist', null) }
                        }),
                        create('div', {
                            addClass: 'grid-10 mobile-grid-15 grid-parent order-by',
                            css: 'text-align:center',
                            text: '&#9660;',
                            data: {
                                by: 'down'
                            },
                            on: { click: search.orderBy.bind(null, 'artist') }
                        })
                    ]
                })
                break
            case 'album':
                f = document.createDocumentFragment()
                f.appendChild(create('option', {
                    val: 'all',
                    text: lang.filterBy.album
                }))
                e.data.album.forEach(a => f.appendChild(create('option', {
                    val: a,
                    text: a
                })))
                $(child[2], {
                    append: [
                        create('select', {
                            addClass: 'grid-90 mobile-grid-85 grid-parent',
                            append: f,
                            on: { click: search.filterBy.bind(null, 'album', null) }
                        }),
                        create('div', {
                            addClass: 'grid-10 mobile-grid-15 grid-parent order-by',
                            css: 'text-align:center',
                            text: '&#9660;',
                            data: {
                                by: 'down'
                            },
                            on: { click: search.orderBy.bind(null, 'album') }
                        })
                    ]
                })
                break
        }
    }
}

/**
 * It will create and render the list of songs from an album
 * @param {object} player - Instance of the player
 * @param {string} folder - Path from where the album is loaded.
 *                          This is to get the name of the album
 * @param {array} listSongs - List of songs from the album.
 */
function createAlbumView(player, folder, albumSongs) {
    let f = document.createDocumentFragment()

    // Name of the band or artist and album
    $('#_addalbumfolder', {
        text: `${albumSongs[0].artist} / <small>${path.basename(folder)}</small>`
    })

    // List of songs
    albumSongs.forEach((s, i) => {
        f.appendChild(create('div', {
            addClass: 'grid-100 album-title-song',
            attr: { 'id': `al-${i}` },
            data: {
                position: i,
                artist: s.artist,
                title: s.title,
                album: s.album
            },
            text: s.title,
            on: { click: playSong.bind(null, player) }
        }))
    })
    $('#album-to-play', {
        child: 1,
        empty() { },
        append: f
    })
}

module.exports = Object.freeze({
    createAlbumView,
    createView
})
