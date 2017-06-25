/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */

/** --------------------------------------- Modules --------------------------------------- **/
// ---- Electron ----
const path = require('path')

// ---- Own ----
const $ = require(path.join(__dirname, '../../', 'dom'))

/* --------------------------------- Variables --------------------------------- */
let regex = null
let searchValue = ''
let newList = []
let list = []
let oldSearchedValue = []
let totalCountSlideMoved = 0
let countSlidedMoved = 0
let totalResults = 0
let countItem = 0
let totalItem = 0
let stepItem = 0
let slide = 0

let parentSlideItem = $(document.createElement('div')).addClass('grid-25 mobile-grid-25').get()
let containerSlider = $(document.createElement('div')).addClass('results')
let slideContainer = document.createDocumentFragment()
let itemSlide = document.createDocumentFragment()


/* --------------------------------- Functions --------------------------------- */
function getValuesFromList(value, listSongs) {
  if ((searchValue = value.trim()) !== '') {
    regex = new RegExp(searchValue.replace(/\s/g, '&nbsp;').trim(), 'ig')

    newList = (newList.length && searchValue.length > oldSearchedValue.length
      ? newList
      : oldSearchedValue = searchValue, listSongs).filter(function (v) {
        return regex.test(v.title)
      })

    return newList
  } else {
    return false
  }
}

function searchDesktopResults(list, btnAction, lang) {
  $('#wrapper-results').empty()
  $('#leftright').addClass('hide')
  containerSlider.css(`width:${document.body.clientWidth - 100}px`)

  if (list.length && list.constructor === Array) {
    // Show possibles results
    totalResults = list.length
    countSlide = slide = totalResults > 20 ? Math.round(totalResults / 20) : 1
    countItem = countSlidedMoved = totalCountSlideMoved = 0
    while (slide--) {
      totalItem = totalResults - countItem > 20 ? 20 : totalResults - countItem
      for (stepItem = 0; stepItem < totalItem; stepItem++ , countItem++) {
        itemSlide.appendChild(
          $(parentSlideItem.cloneNode(false))
            .text(`<div class="search-results">${list[countItem].title}</div>`)
            .data({ position: list[countItem].position })
            .on({ click: btnAction }).get()
        )
      }

      slideContainer.appendChild(
        $(containerSlider.get()
          .cloneNode(false))
          .append(itemSlide).get()
      )

      itemSlide = document.createDocumentFragment()
    }

    // Display all the filtered songs
    $('#wrapper-results')
      .empty()
      .append(slideContainer)
      .removeClass('no-searching-found')
      .css(`width:${countSlide * (document.body.clientWidth - 100)}px`, true)

    $('#leftright').removeClass('hide')
  } else if (list.constructor === Array) {
    // Clean if there's no coincidence
    $('#wrapper-results')
      .text(lang.alerts.searchingResults)
      .addClass('no-searching-found')
      .css(`width:${document.body.clientWidth - 100}px`, true)

    $('#leftright').addClass('hide')
  } else {
    // Clean if there's no coincidence
    $('#wrapper-results')
      .text(lang.alerts.searchingResults)
      .addClass('no-searching-found')
      .css(`width:${document.body.clientWidth - 100}px`, true)
    $('#leftright').addClass('hide')
  }

  slideContainer = document.createDocumentFragment()
}

module.exports = {
  getValuesFromList,
  searchDesktopResults,
  reset: function () {
    newList, list = []
    searchValue = oldSearchedValue = ''
  }
}