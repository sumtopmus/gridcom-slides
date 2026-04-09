/**
 * Create an SVG <text> element with Virgil font.
 * Loaded via <script src="../../shared/js/svg-text.js"></script>
 *
 * @param {number|string} x
 * @param {number|string} y
 * @param {string} text
 * @param {object} [opts]
 * @param {number|string} [opts.fontSize=15]
 * @param {string} [opts.fill='currentColor']
 * @param {string} [opts.anchor='middle']
 * @param {number|string} [opts.opacity]
 * @param {string} [opts.transform]
 * @param {string} [opts.dy]
 * @param {string} [opts.fontWeight]
 * @returns {SVGTextElement}
 */
function svgText(x, y, text, { fontSize = 15, fill = 'currentColor', anchor = 'middle', opacity, transform, dy, fontWeight } = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  el.setAttribute('x', x)
  el.setAttribute('y', y)
  el.setAttribute('font-family', "'Virgil', cursive")
  el.setAttribute('font-size', fontSize)
  el.setAttribute('fill', fill)
  el.setAttribute('text-anchor', anchor)
  if (opacity != null && opacity !== 1) el.setAttribute('opacity', opacity)
  if (transform) el.setAttribute('transform', transform)
  if (dy) el.setAttribute('dy', dy)
  if (fontWeight) el.setAttribute('font-weight', fontWeight)
  el.textContent = text
  return el
}
