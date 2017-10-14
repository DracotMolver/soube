/**
 * @module equalizer/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * This module create the Equalizer panel with all its features
 */

/* -=================================== Modules ===================================- */
// ---- Node ----
const path = require('path')

// ---- Own ----
const {
    configFile,
    langFile,
    editFile
} = require(path.join(__dirname, '../../', 'config')).init()
const { $, create } = require(path.join(__dirname, '../../', 'dom'))

// ---- Electronjs ----
const ipcRenderer = require('electron').ipcRenderer

/* -=================================== Variables ===================================- */
let lang = langFile[configFile.lang]
let interval
let option
let settingName = ''
let orientation = ''
let percent = 0
let eqHrz = 0
let pos = 0
let eqF = []
let predefinedSettings = ['rock', 'acustic', 'electro', 'reset']

/* -=================================== Functions ===================================- */
/**
 * Parse the DB values
 *
 * @param {string} - a value to be parsed
 * @returns {number} - a value representing the actual DB

 */
function getDB(value) {
    return value ? (value === 12 ? 12 : (12 - (value / 10)).toFixed(1)) : 0
}

/**
 * Set the Equalizer configuration base on the predefined ones and the ones
 * that can be created.
 * The predefined settings can not be deleted but the ones that were created.
 * 
 * @param {string} option - Predefined: rock, electro, acustic, reset
 */
function setBtnOptions(option) {
    if (!predefinedSettings.includes(option)) {
        $('#modify-new-eq', { removeClass: 'hide' })
        $('#text-new-eq', { text: (settingName = option) })
    } else {
        $('#modify-new-eq', { addClass: 'hide' })
        $('#add-new-eq', { addClass: 'hide' })
        $('#edit-new-eq', { addClass: 'hide' })
        $('#text-new-eq', { text: '' })
    }
}

/**
 * Set the specific value a single element.
 * The element is the one that holds the DB values
 * 
 * @param {HTMLElement} el - El HTMLElement holding the DB values
 */
function setEQ(el) {
    eqF = []
    switch ((settingName = el.value)) {
        case 'new':
            $('#add-new-eq', { removeClass: 'hide' })
            $('#edit-new-eq', { addClass: 'hide' })
            $('#modify-new-eq', { addClass: 'hide' })
            $('.warning', { text: '' })

            for (var i = 0; i < 15; i++) {
                $(`#range-${i}`, { css: 'top:120' })
                $(`#db-${i}`, { text: '0 dB' })
                eqF.push([i, getDB(eqHrz[i])])
            }
            ipcRenderer.send('equalizer-filter', eqF)
            break
        default:
            if (settingName !== 'none') {
                setBtnOptions(settingName)

                configFile.equalizerConfig = settingName
                editFile('config', configFile)

                eqHrz = configFile.equalizer[settingName]
                for (var i = 0; i < 15; i++) {
                    $(`#range-${i}`, { css: `top:${eqHrz[i] ? eqHrz[i] : 120}px` })
                    $(`#db-${i}`, { text: `${getDB(eqHrz[i])} dB` })
                    eqF.push([i, getDB(eqHrz[i])])
                }
                ipcRenderer.send('equalizer-filter', eqF)
            }
            break
    }
}

/**
 * Save a new configuration
 */
function saveEQSetting() {
    let newSetting = []
    let name = $('#name-new-eq', { val: '' }).trim()

    $('.range-total-percent', {
        each(v) {
            newSetting.push(parseInt($(v, { cssValue: 'top' })))
        }
    })

    configFile.equalizer[name] = newSetting
    editFile('config', configFile)

    $('#add-new-eq', { addClass: 'hide' })
    $('.warning', { text: lang.config.newEQSettingSaved })

    $('#eq-buttons', {
        append: [
            $('#eq-buttons', { lastChild() { } }),
            create('option', {
                val: name,
                text: name,
            })
        ]
    })

    const timeOut = setTimeout(() => {
        $('.warning', { text: '' })
        clearTimeout(timeOut)
    }, 2600)
}

/**
 * Delete a created configuration
 */
function deleteSetting() {
    if (delete configFile.equalizer[settingName]) {
        configFile.equalizerConfig = 'reset'

        $('.warning', { text: lang.config.newEQSettingDeleted })
        $('#modify-new-eq', { addClass: 'hide' })
        $('#eq-buttons', { rmChild: settingName })

        editFile('config', configFile)
        eqF = []
        for (var i = 0; i < 15; i++) {
            $(`#range-${i}`, { css: 'top:120px' })
            $(`#db-${i}`, { text: '0 dB' })
            eqF.push([i, 0])
        }
        ipcRenderer.send('equalizer-filter', eqF)

        const timeOut = setTimeout(() => {
            $('.warning', { text: '' })
            clearTimeout(timeOut)
        }, 2600)
    }
}

/**
 * Update the created setting
 */
function updateEQSeeting() {
    let newSetting = []
    let name = $('#name-new-eq-edit', { val: '' })

    $('.range-total-percent', {
        each(v) {
            newSetting.push(parseInt($(v, { cssValue: 'top' })))
        }
    })

    delete configFile.equalizer[settingName]
    configFile.equalizer[name] = newSetting
    if (configFile.equalizerConfig === settingName)
        configFile.equalizerConfig = name

    editFile('config', configFile)

    $('#edit-new-eq', { addClass: 'hide' })
    $('.warning', { text: lang.config.newEQSettingSaved })

    const timeOut = setTimeout(() => {
        $('.warning', { text: '' })
        $('#name-new-eq-edit', { val: name })
        $('#modify-new-eq', { removeClass: 'hide' })
        clearTimeout(timeOut)
    }, 2600)
}

/**
 * Display the Equalizer panel after had been created all the elements
 */
function showEqualizer() {
    $('#main-parent-container', { css: '-webkit-filter:blur(1px)' })
    $('#_equalizerSetting', { text: lang.config.equalizerSetting })

    $('#_neweq', { text: lang.config.newEQ })

    // EQ select settings options
    let f = document.createDocumentFragment()
    Object.keys(configFile.equalizer).forEach(v => {
        f.appendChild(create('option', {
            val: v,
            text: v,
            attr: configFile.equalizerConfig === v ? { selected: 'selected' } : ''
        }))

        if (configFile.equalizerConfig === v) setBtnOptions(v)
    })

    // Option to add a new EQ setting
    f.appendChild(create('option', {
        val: 'new',
        text: lang.config.addNewEQSetting
    }))
    $('#eq-buttons', { empty() { }, append: f })

    eqHrz = configFile.equalizer[configFile.equalizerConfig]
    for (var i = 0; i < 15; i++) {
        $(`#range-${i}`, { css: `top:${eqHrz[i] ? eqHrz[i] : 120}px` })
        $(`#db-${i}`, { text: `${getDB(eqHrz[i])} dB` })
    }

    // Delete and edit option over a new EQ setting
    $('#edit-name', { text: lang.config.newEQSettingEdit })
    $('#delete-name', { text: lang.config.newEQSettingDelete })
    $('#_saveeq', { text: lang.config.newEQSettingUpdate })
    $('#_canceleq', { text: lang.config.newEQSettingCancel })

    $($('.parent-container-config')[2], {
        removeClass: 'hide',
        child: 0,
        addClass: 'container-config-anim'
    })
}

/**
 * Fills up the bar of the DB settings.
 * Also, set the percent of it, so later it can be captured and parsed
 * 
 * @param {HTMLElement} el - the clicked element
 */
function dbSetting(el) {
    orientation = $(el, { data: 'orientation' })
    pos = $(el, { data: 'position' })
    percent = parseInt($(`#range-${pos}`, { cssValue: 'top' }))

    const animation = () => {
        if (orientation === 'up' && percent)
            $(`#range-${pos}`, { css: `top:${--percent}px` })
        else if (orientation === 'down' && percent)
            $(`#range-${pos}`, { css: `top:${++percent}px` })

        if (percent) {
            $(`#db-${pos}`, { text: `${getDB(percent)} dB` })
            ipcRenderer.send('equalizer-filter', [pos, getDB(percent)])
            interval = setTimeout(animation, 80)
        } else {
            clearTimeout(interval)
        }
    }
    interval = setTimeout(animation, 80)
}

/**
 * Clean and reset all the values
 */
function close() {
    $('#modify-new-eq', { addClass: 'hide' })
    $('#edit-new-eq', { addClass: 'hide' })
    $('#add-new-eq', { addClass: 'hide' })
    $('#name-new-eq', { clearVal() { } })

    clearTimeout(interval)
    percent = eqHrz = pos = 0
    settingName = ''
    option = null
}

/* --------------------------------- Events --------------------------------- */
/**
 * Cancel the created setting
 */
$('#_canceleq', {
    on: {
        click(el) {
            $('#modify-new-eq', { removeClass: 'hide' })
            $('#edit-new-eq', { addClass: 'hide' })
        }
    }
})

/**
 * Save the setting
 */
$('#_saveeq', { on: { click: updateEQSeeting } })

/**
 * Delete the setting
 */
$('#delete-name', { on: { click: deleteSetting } })

/**
 * Edit a setting
 */
$('#edit-name', {
    on: {
        click(el) {
            $('#name-new-eq-edit', {
                val: (settingName = $('#text-new-eq', { text: '' }))
            })
            $('#modify-new-eq', { addClass: 'hide' })
            $('#edit-new-eq', { removeClass: 'hide' })
        }
    }
})

/**
 * Action over the Db buttons
 */
$('.db-up-down', {
    on: {
        mousedown: dbSetting,
        mouseup(el) { clearTimeout(interval) },
        mouseleave(el) { clearTimeout(interval) }
    }
})

/**
 * Select a Equalizer setting
 */
$('#eq-buttons', { on: { change: setEQ } })

/**
 * Show the input to type a new setting name
 */
$('#_neweq', { on: { click: saveEQSetting } })

/**
 * Action over the input showed when clicked over '_neweq' button
 */
$('#name-new-eq', {
    on: {
        keyup(el) {
            el.value.trim().length
                ? $('#_neweq', { rmAttr: 'disabled' })
                : $('#_neweq', { attr: { disabled: true } })
        }
    }
})

module.exports = Object.freeze({
    showEqualizer,
    close
})
