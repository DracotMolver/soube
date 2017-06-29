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
let containerResult = 0
let wrapperWidth = 0
let totalResults = 0
let countSlide = 0
let countItem = 0
let totalItem = 0
let stepItem = 0
let slide = 0

let parentSlideItem = $(document.createElement('div')).addClass('grid-25 mobile-grid-25').get()
let containerSlider = $(document.createElement('div')).addClass('results')
let itemContainer = $(document.createElement('ul')).addClass('mobile-grid-100 grid-parent')
let items = $(document.createElement('li')).get()
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

function searchDesktopResults(list, btnActions, lang) {
  $('#wrapper-results').empty()
  $('#leftright').addClass('hide')
  containerSlider.css(`width:${containerResult}px`)

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
            .text(`<div class="search-results" title="${list[countItem].title}">${list[countItem].title}</div>`)
            .data({ position: list[countItem].position })
            .on({ click: btnActions }).get()
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
      .css(`width:${countSlide * (containerResult)}px`, true)

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

function animSlideSongs() {
  wrapperWidth = parseInt($('#wrapper-results').cssValue('width')) - containerResult

  if ($(this).data('direction') === 'right' && totalCountSlideMoved < wrapperWidth)
    ++countSlidedMoved
  else if ($(this).data('direction') === 'left' && countSlidedMoved)
    --countSlidedMoved

  if (countSlidedMoved >= 0) {
    $("#wrapper-results").css(
      `transform:translateX(${-(totalCountSlideMoved = countSlidedMoved * containerResult)}px)`
    );
  }
}

function searchMobileResults(list, btnActions, lang) {
  if (list.length && list.constructor === Array) {
    itemSlide = document.createDocumentFragment()
    list.forEach(function (v) {
      itemSlide.appendChild(
        $(items.cloneNode(false))
          .text(`<div class="" title="${v.title}">${v.title}</div>`)
          .data({ position: v.position })
          .on({ click: btnActions }).get()
      )
    })

    itemContainer.empty().append(itemSlide)
    $('#wrapper-results').empty().append(itemContainer)

    // If the amout of items is more than 5, it should be display
    // the scrollbar
    if (list.length < 5)
      itemContainer.css('height:auto')
    else
      itemContainer.rmAttr('style')
  } else {

  }
}

module.exports = {
  getValuesFromList,
  searchDesktopResults,
  searchMobileResults,
  animSlideSongs,
  setWidthContainer: function (width) {
    containerResult = width
  },
  reset: function () {
    newList, list = []
    searchValue = oldSearchedValue = ''
  }
}