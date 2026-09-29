/**
 * The rendered side of the enumerative diff: every element on the page that owns text,
 * with the style the browser actually resolved and — crucially — its *composited* fill
 * and border.
 *
 * Compositing is not a nicety. An element at `opacity: 0.41` paints a dimmed fill AND a
 * dimmed border; comparing a raw `border-color` against Figma's raw border colour makes a
 * fully opaque outline look correct. That mistake is one of the defects this rework
 * exists to catch, so the compositing happens here, in the page, once.
 */
import { FidelityError } from './errors.mjs'

/* c8 ignore start -- runs inside the browser, not under node */
function collectAll() {
  const parseColor = (value) => {
    const m = /^rgba?\(([^)]+)\)$/i.exec(String(value || '').trim())
    if (!m) return null
    const parts = m[1]
      .split(/[,\s/]+/)
      .filter(Boolean)
      .map(Number)
    if (parts.length < 3) return null
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts.length > 3 ? parts[3] : 1,
    }
  }
  const toHex = (c) =>
    '#' +
    [c.r, c.g, c.b]
      .map((n) => Math.round(n).toString(16).padStart(2, '0'))
      .join('')
  const over = (fg, bg) => {
    if (!fg) return bg
    if (!bg) return fg
    const a = fg.a
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1,
    }
  }

  /** The colour actually painted behind `el`, walking up until something is opaque. */
  const backdropOf = (el) => {
    const layers = []
    let node = el.parentElement
    while (node) {
      const cs = getComputedStyle(node)
      const colour = parseColor(cs.backgroundColor)
      const opacity = Number(cs.opacity)
      if (colour && colour.a > 0) {
        layers.push({
          ...colour,
          a: colour.a * (Number.isNaN(opacity) ? 1 : opacity),
        })
        if (colour.a * opacity >= 0.999) break
      }
      node = node.parentElement
    }
    let result = { r: 255, g: 255, b: 255, a: 1 }
    for (let i = layers.length - 1; i >= 0; i -= 1)
      result = over(layers[i], result)
    return result
  }

  const normalise = (value) =>
    String(value || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()

  const ownsText = (el) => {
    for (const child of el.childNodes) {
      if (child.nodeType === 3 && child.textContent.trim()) return true
    }
    return false
  }

  const pathOf = (el) => {
    const parts = []
    let node = el
    while (node && node.nodeType === 1 && parts.length < 6) {
      let part = node.tagName.toLowerCase()
      if (node.id) {
        parts.unshift(`${part}#${node.id}`)
        break
      }
      const cls = (node.getAttribute('class') || '').trim().split(/\s+/)[0]
      if (cls) part += `.${cls}`
      parts.unshift(part)
      node = node.parentElement
    }
    return parts.join(' > ')
  }

  const all = [...document.querySelectorAll('*')]
  const index = new Map()
  all.forEach((el, i) => index.set(el, i))

  const record = (el) => {
    const cs = getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    const elementOpacity = Number(cs.opacity)
    const opacity = Number.isNaN(elementOpacity) ? 1 : elementOpacity
    const backdrop = backdropOf(el)
    const own = parseColor(cs.backgroundColor)
    const border = parseColor(cs.borderTopColor)
    const borderWidth = parseFloat(cs.borderTopWidth) || 0

    const compositedBackground = over(
      own && own.a > 0 ? { ...own, a: own.a * opacity } : null,
      backdrop
    )
    const compositedBorder =
      border && borderWidth > 0
        ? over({ ...border, a: border.a * opacity }, backdrop)
        : null

    const ancestry = []
    for (let n = el.parentElement; n; n = n.parentElement) {
      if (index.has(n)) ancestry.push(index.get(n))
    }

    return {
      i: index.get(el),
      ancestors: ancestry,
      tagName: el.tagName.toLowerCase(),
      path: pathOf(el),
      figmaNode: el.getAttribute('data-figma-node') || null,
      text: normalise(el.textContent),
      ownsText: ownsText(el),
      fontFamily: cs.fontFamily,
      fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle,
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing,
      textTransform: cs.textTransform,
      textDecorationLine: cs.textDecorationLine,
      textAlign: cs.textAlign,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      borderColor: cs.borderTopColor,
      borderWidth: cs.borderTopWidth,
      borderRadius: cs.borderTopLeftRadius,
      opacity,
      compositedBackgroundColor: toHex(compositedBackground),
      compositedBorderColor: compositedBorder ? toHex(compositedBorder) : null,
      rect: {
        top: Math.round(rect.top + window.scrollY),
        left: Math.round(rect.left + window.scrollX),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      rendered:
        cs.display !== 'none' &&
        cs.visibility !== 'hidden' &&
        opacity > 0 &&
        rect.width > 0 &&
        rect.height > 0,
    }
  }

  // Landmarks are recorded even when they paint nothing of their own: they are the
  // elements a design's Header/Footer/section actually becomes, and a box that cannot
  // find the element rendering it can never be compared.
  const LANDMARKS = new Set([
    'header',
    'footer',
    'main',
    'nav',
    'section',
    'article',
    'aside',
    'form',
    'ul',
    'body',
  ])

  const texts = []
  const boxes = []
  const svgFills = new Set()
  for (const el of all) {
    if (el.tagName === 'SVG' || el instanceof SVGElement) {
      const fill = getComputedStyle(el).fill
      if (fill && fill !== 'none') svgFills.add(fill)
      const attr = el.getAttribute && el.getAttribute('fill')
      if (attr && attr !== 'none') svgFills.add(attr)
    }
    const r = record(el)
    if (r.ownsText && r.text) texts.push(r)
    else if (
      r.rendered &&
      (r.compositedBorderColor ||
        (parseColor(r.backgroundColor) || { a: 0 }).a > 0 ||
        parseFloat(r.borderRadius) > 0 ||
        LANDMARKS.has(r.tagName))
    ) {
      boxes.push(r)
    }
  }
  return {
    texts,
    boxes,
    svgFills: [...svgFills],
    documentHeight: document.documentElement.scrollHeight,
  }
}
/* c8 ignore stop */

export async function collectDom(page) {
  let result
  try {
    result = await page.evaluate(collectAll)
  } catch (err) {
    throw new FidelityError(
      `could not read the rendered document: ${err.message}`,
      'A page the collector cannot read must abort the run, never report zero findings.'
    )
  }
  if (!result || !Array.isArray(result.texts)) {
    throw new FidelityError('the DOM collector returned nothing usable.')
  }
  if (result.texts.length === 0) {
    throw new FidelityError('the rendered page contains no text at all.', {
      hint: 'Every route in this design has copy on it. Zero text means the page did not render, and every "matched 0 of 0" below would be a lie.',
    })
  }
  return result
}
