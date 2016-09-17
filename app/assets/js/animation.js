/**
 * -------------------------- Módulo Animation -------------------------- *
 * @author Diego Alberto Molina
 *
 * Módulo que hace uso de la Web Api Animation.
 * Es solo para animar como slide la canción, el artista y el album
 **/
require('./commons')

function Animation(element) {
  let el = element
  let scrollStart = null
  let scrollEnd = null
  let enableScrollEnd = true
  let resize = true
  /**
   * Generará una animación sobre la información de una canción que sea demasiado larga
   */
  return {
    start: function () {
      resize = true
      let _el = el.element
      const width = _el.children[0].scrollWidth
      if (width > _el.clientWidth) {
        scrollStart = _el.animate([
          { transform: 'translateX(0px)' },
          { transform: `translateX(-${width}px)` },
        ], { iterations: 1, duration: 4600, delay: 8600 })

        scrollStart.onfinish = () => {
          if (enableScrollEnd) {
            enableScrollEnd = false

            scrollEnd = _el.animate([
              { transform: `translateX(${width}px)` },
              { transform: 'translateX(0px)' }
            ], { iterations: 1, duration: 4600 })

            scrollEnd.onfinish = () => {
              scrollStart.play()
            }
          }

          scrollEnd.play()
        }

        // Resetear la animación cuando la ventana cambie a responsive
        window.onresize = e => {
          if (resize) {
            if (scrollStart !== null && scrollStart.playState === 'running')
              scrollStart.cancel()
            if (scrollEnd !== null && scrollEnd.playState === 'running')
              scrollEnd.cancel()

            scrollEnd = scrollStart = null
            enableScrollEnd = true
            resize = false
            this.start()
          }
        }
      } else if (scrollStart !== null) {
        if (scrollStart !== null && scrollStart.playState === 'running')
          scrollStart.cancel()
        if (scrollEnd !== null && scrollEnd.playState === 'running')
          scrollEnd.cancel()

        scrollEnd = scrollStart = null
        enableScrollEnd = resize = true
      }
    }
  }
}

module.exports = Object.freeze({
  Animation
})
