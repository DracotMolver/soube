/**
 * @module songFolder/workerPaths.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * This module will get all the folders or subforlders from a parent/root folder
 */
/* -=================================== Modules ===================================- */
const path = require('path')
const fs = require('fs')

/* -=================================== Functions ===================================- */
/**
 * Get all without recursion
 *
 * @param {string} dir - Root or parent folder
 */
function findFiles(dir) {
    let tmpFolders = []
    let allFiles = []
    let folders = []
    let foldersSize = 0
    let baseFolder = ''

    fs.readdirSync(dir).forEach(files => {
        // Based folders
        baseFolder = path.join(dir, files)
        if (fs.lstatSync(baseFolder).isDirectory())
            folders.push(baseFolder)
        else if (fs.lstatSync(baseFolder).isFile() && /\.(mp3|wav|ogg)$/ig.test(baseFolder.trim()))
            allFiles.push(baseFolder)
    })

    foldersSize = folders.length - 1
    var count = 0
    while (foldersSize > -1) {
        fs.readdirSync(folders[foldersSize]).forEach(function (files) {
            baseFolder = path.join(folders[foldersSize], files)
            if (fs.lstatSync(baseFolder).isDirectory())
                tmpFolders.push(baseFolder)
            else if (fs.lstatSync(baseFolder).isFile() && /\.(mp3|wav|ogg)$/ig.test(baseFolder.trim()))
                allFiles.push(baseFolder)
        })

        folders.pop()
        foldersSize = (folders = folders.concat(tmpFolders)).length - 1
    }

    postMessage({ files: allFiles.join('|') })
}

this.onmessage = e => findFiles(e.data.folder)
