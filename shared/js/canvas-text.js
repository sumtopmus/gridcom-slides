/**
 * Draw text on a canvas 2D context using the slide's theme font.
 * Loaded via <script src="../../shared/js/canvas-text.js"></script>
 *
 * The font family is read from <body>'s computed style on first call
 * and cached, so it automatically matches whatever theme is active.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {string} text
 * @param {object} [opts]
 * @param {number} [opts.fontSize=15]
 * @param {string} [opts.fill]
 * @param {string} [opts.anchor='middle']  — 'start' | 'middle' | 'end'
 * @param {number} [opts.opacity]
 * @param {string} [opts.transform]  — supports rotate(angle,cx,cy)
 * @param {string} [opts.dy]  — vertical offset (e.g. '0.35em')
 * @param {string} [opts.fontWeight]
 */
function canvasText(ctx, x, y, text, { fontSize = 15, fill, anchor = 'middle', opacity, transform, dy, fontWeight } = {}) {
  ctx.save()
  if (!canvasText._font) canvasText._font = getComputedStyle(document.body).fontFamily
  const weight = fontWeight || 'normal'
  ctx.font = `${weight} ${fontSize}px ${canvasText._font}`
  if (fill) ctx.fillStyle = fill
  ctx.textAlign = anchor === 'middle' ? 'center' : anchor
  ctx.textBaseline = 'alphabetic'
  if (opacity != null && opacity !== 1) ctx.globalAlpha = opacity
  if (dy) {
    const parsed = parseFloat(dy)
    if (String(dy).includes('em')) y += parsed * fontSize
    else y += parsed
  }
  if (transform) {
    const m = transform.match(/rotate\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/)
    if (m) {
      const angle = Number(m[1]), cx = Number(m[2]), cy = Number(m[3])
      ctx.translate(cx, cy)
      ctx.rotate(angle * Math.PI / 180)
      ctx.translate(-cx, -cy)
    }
  }
  ctx.fillText(text, x, y)
  ctx.restore()
}
