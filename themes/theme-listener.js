/*
 * GRIDCOM — Theme listener (optional)
 *
 * Listens for slideEnter and slideTheme messages from the viewer and applies
 * the viewer's resolved color mode as data-theme="dark|light" on <html>.
 *
 * Not needed by aurora or eclipse — those have a fixed visual appearance
 * regardless of the viewer's interface color mode. Include this only if you
 * are building a custom adaptive theme that changes appearance based on the
 * viewer's dark/light setting.
 *
 *   <script src="../../themes/theme-listener.js" defer></script>
 */
;(function () {
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme
  }

  window.addEventListener('message', function (e) {
    if (e.data?.type === 'slideEnter' && e.data.theme) {
      applyTheme(e.data.theme)
    }
    if (e.data?.type === 'slideTheme') {
      applyTheme(e.data.theme)
    }
  })
})()
