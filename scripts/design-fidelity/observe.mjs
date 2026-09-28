import { FidelityError } from './errors.mjs'

/**
 * Runs inside the page. Returns one record per element matching `selector`,
 * built from *computed* style — never from a screenshot. A composited pixel is
 * not a fill; getComputedStyle is what the browser actually resolved.
 */
/* c8 ignore start */
function collect(selector) {
  const out = []
  for (const el of document.querySelectorAll(selector)) {
    const cs = getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    let assetUrl = ''
    const img =
      el.tagName === 'IMG' ? el : el.querySelector('img, image, source')
    if (img) {
      assetUrl =
        img.currentSrc ||
        img.getAttribute('src') ||
        img.getAttribute('href') ||
        ''
    } else {
      const bg = cs.backgroundImage
      const m =
        bg && bg !== 'none' ? /url\(["']?([^"')]+)["']?\)/.exec(bg) : null
      if (m) assetUrl = m[1]
    }
    // `fill` only means something on SVG content; for a wrapper, read the svg inside it.
    const svg =
      el instanceof SVGElement ? el : el.querySelector('svg, path, use')
    out.push({
      tagName: el.tagName.toLowerCase(),
      fontFamily: cs.fontFamily,
      fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle,
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing,
      textTransform: cs.textTransform,
      textDecorationLine: cs.textDecorationLine,
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      borderColor: cs.borderTopColor,
      fill: svg ? getComputedStyle(svg).fill : '',
      borderWidth: cs.borderTopWidth,
      borderRadius: cs.borderTopLeftRadius,
      paddingTop: cs.paddingTop,
      paddingRight: cs.paddingRight,
      paddingBottom: cs.paddingBottom,
      paddingLeft: cs.paddingLeft,
      gap: cs.columnGap === 'normal' ? '0px' : cs.columnGap,
      width: `${Math.round(rect.width)}px`,
      height: `${Math.round(rect.height)}px`,
      assetUrl,
      rendered:
        cs.display !== 'none' &&
        cs.visibility !== 'hidden' &&
        Number(cs.opacity) > 0 &&
        rect.width > 0 &&
        rect.height > 0,
    })
  }
  return out
}
/* c8 ignore stop */

export async function observe(page, selector) {
  let raw
  try {
    raw = await page.evaluate(collect, selector)
  } catch (err) {
    throw new FidelityError(
      `selector ${JSON.stringify(selector)} is not valid CSS (${err.message}).`
    )
  }
  return raw.map(decorateAsset)
}

/**
 * Turns whatever ended up in `src` into a stable identity:
 * Next.js' /_next/image?url=%2Fassets%2Fx.webp&w=828 is the same asset as
 * /assets/x.webp, and must not read as a different one.
 */
export function decorateAsset(record) {
  const url = record.assetUrl || ''
  let assetPath = ''
  if (url) {
    let parsed
    try {
      parsed = new URL(url, 'http://placeholder.invalid')
    } catch {
      parsed = null
    }
    if (parsed) {
      if (
        parsed.pathname === '/_next/image' &&
        parsed.searchParams.get('url')
      ) {
        assetPath = parsed.searchParams.get('url')
      } else {
        assetPath = parsed.pathname
      }
    } else {
      assetPath = url
    }
  }
  return {
    ...record,
    assetPath,
    assetBasename: assetPath ? assetPath.split('/').pop() : '',
  }
}

/**
 * Resolves a CSS colour expression through the real cascade, so token
 * assertions go through the browser's own hsl() maths instead of a
 * reimplementation of it here.
 */
export async function resolveCssExpression(page, expression) {
  const value = await page.evaluate((expr) => {
    const probe = document.createElement('div')
    probe.style.position = 'absolute'
    probe.style.left = '-9999px'
    probe.style.width = '1px'
    probe.style.height = '1px'
    probe.style.backgroundColor = ''
    probe.style.backgroundColor = expr
    document.documentElement.appendChild(probe)
    const resolved = getComputedStyle(probe).backgroundColor
    const declared = probe.style.backgroundColor
    probe.remove()
    return { resolved, declared }
  }, expression)
  if (!value.declared) {
    throw new FidelityError(
      `CSS expression ${JSON.stringify(expression)} was rejected by the browser as a colour.`,
      'Check the custom property name — a misspelt var() silently produces nothing.'
    )
  }
  // An undefined custom property is not a syntax error: `hsl(var(--nope))`
  // parses fine and then computes to the initial value, i.e. transparent.
  // That must read as a broken assertion, not as a colour that happens to differ.
  if (
    /^rgba\(0,\s*0,\s*0,\s*0\)$/.test(value.resolved) &&
    expression.includes('var(')
  ) {
    throw new FidelityError(
      `CSS expression ${JSON.stringify(expression)} resolved to nothing — the custom property it reads is not defined on this page.`,
      'Check the token name against @cennso/theme/dist/theme.css.'
    )
  }
  return value.resolved
}
