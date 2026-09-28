import { FidelityError } from './errors.mjs'

/**
 * The property registry.
 *
 * Every key a snapshot may put inside `expect` has to be declared here. A key
 * that is not in this table is a hard error, not a silently ignored line —
 * a typo'd property must never make an assertion vacuously pass.
 *
 * `read` names the field of the observation record (see observeElement below)
 * the value comes from. `compare` decides equality. `kind` drives how the
 * expected value is validated when the snapshot is loaded.
 */
const COLOR = 'color'
const LENGTH = 'length'
const TEXT = 'text'

export const PROPERTIES = {
  // typography
  fontFamily: { read: 'fontFamily', kind: TEXT, compare: containsFold },
  fontWeight: { read: 'fontWeight', kind: TEXT, compare: weightEquals },
  fontStyle: { read: 'fontStyle', kind: TEXT, compare: strictEquals },
  fontSize: { read: 'fontSize', kind: LENGTH, compare: lengthEquals },
  lineHeight: { read: 'lineHeight', kind: LENGTH, compare: lengthEquals },
  letterSpacing: { read: 'letterSpacing', kind: LENGTH, compare: lengthEquals },
  textTransform: { read: 'textTransform', kind: TEXT, compare: strictEquals },
  textDecorationLine: {
    read: 'textDecorationLine',
    kind: TEXT,
    compare: strictEquals,
  },
  text: { read: 'text', kind: TEXT, compare: strictEquals },

  // colour
  color: { read: 'color', kind: COLOR, compare: colorEquals },
  backgroundColor: {
    read: 'backgroundColor',
    kind: COLOR,
    compare: colorEquals,
  },
  borderColor: { read: 'borderColor', kind: COLOR, compare: colorEquals },
  fill: { read: 'fill', kind: COLOR, compare: colorEquals },

  // box
  borderWidth: { read: 'borderWidth', kind: LENGTH, compare: lengthEquals },
  borderRadius: { read: 'borderRadius', kind: LENGTH, compare: lengthEquals },
  paddingTop: { read: 'paddingTop', kind: LENGTH, compare: lengthEquals },
  paddingRight: { read: 'paddingRight', kind: LENGTH, compare: lengthEquals },
  paddingBottom: { read: 'paddingBottom', kind: LENGTH, compare: lengthEquals },
  paddingLeft: { read: 'paddingLeft', kind: LENGTH, compare: lengthEquals },
  gap: { read: 'gap', kind: LENGTH, compare: lengthEquals },
  width: { read: 'width', kind: LENGTH, compare: lengthEquals },
  height: { read: 'height', kind: LENGTH, compare: lengthEquals },

  // assets — the file an <img>/<image>/<source> actually resolved to, with
  // Next.js' /_next/image?url=... wrapper unwrapped.
  assetPath: { read: 'assetPath', kind: TEXT, compare: strictEquals },
  assetBasename: { read: 'assetBasename', kind: TEXT, compare: strictEquals },
  assetPathContains: { read: 'assetPath', kind: TEXT, compare: contains },
}

/** Tolerance is a loophole, so it is capped. */
export const MAX_TOLERANCE = 4

export function assertKnownProperty(key, where) {
  if (!Object.prototype.hasOwnProperty.call(PROPERTIES, key)) {
    throw new FidelityError(`${where}: unknown expected property "${key}".`, {
      hint: `Known properties: ${Object.keys(PROPERTIES).sort().join(', ')}. Add an extractor in scripts/design-fidelity/properties.mjs if the design really needs a new one.`,
    })
  }
}

/* ------------------------------------------------------------------ */
/* comparators                                                         */
/* ------------------------------------------------------------------ */

function strictEquals(expected, actual) {
  return normalizeText(expected) === normalizeText(actual)
}

function contains(expected, actual) {
  return String(actual ?? '').includes(String(expected))
}

function containsFold(expected, actual) {
  return String(actual ?? '')
    .toLowerCase()
    .includes(String(expected).toLowerCase())
}

const NAMED_WEIGHTS = { normal: '400', bold: '700' }

function weightEquals(expected, actual) {
  const norm = (v) => NAMED_WEIGHTS[String(v).toLowerCase()] ?? String(v).trim()
  return norm(expected) === norm(actual)
}

function lengthEquals(expected, actual, tolerance) {
  const e = parsePx(expected)
  const a = parsePx(actual)
  if (e === null || a === null) return strictEquals(expected, actual)
  return Math.abs(e - a) <= tolerance
}

function colorEquals(expected, actual, tolerance) {
  const e = parseColor(expected)
  const a = parseColor(actual)
  if (!e || !a) return false
  if (Math.abs(e.a - a.a) > 0.01) return false
  return (
    Math.abs(e.r - a.r) <= tolerance &&
    Math.abs(e.g - a.g) <= tolerance &&
    Math.abs(e.b - a.b) <= tolerance
  )
}

/* ------------------------------------------------------------------ */
/* parsing / normalising                                               */
/* ------------------------------------------------------------------ */

export function normalizeText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parsePx(value) {
  const m = /^(-?[\d.]+)px$/.exec(String(value ?? '').trim())
  return m ? Number(m[1]) : null
}

export function parseColor(value) {
  const v = String(value ?? '').trim()
  let m = /^#([0-9a-f]{6})$/i.exec(v)
  if (m) {
    const n = parseInt(m[1], 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 }
  }
  m = /^#([0-9a-f]{3})$/i.exec(v)
  if (m) {
    const [r, g, b] = m[1].split('')
    return {
      r: parseInt(r + r, 16),
      g: parseInt(g + g, 16),
      b: parseInt(b + b, 16),
      a: 1,
    }
  }
  m = /^rgba?\(([^)]+)\)$/i.exec(v)
  if (m) {
    const parts = m[1]
      .split(/[,\s/]+/)
      .filter(Boolean)
      .map(Number)
    if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts.length > 3 && !Number.isNaN(parts[3]) ? parts[3] : 1,
    }
  }
  if (v === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
  return null
}

/** Human-readable form used in failure output, so #ffb31b is never printed as rgb(255, 179, 27). */
export function formatColor(value) {
  const c = parseColor(value)
  if (!c) return String(value)
  const hex =
    '#' +
    [c.r, c.g, c.b]
      .map((n) => Math.round(n).toString(16).padStart(2, '0'))
      .join('')
  return c.a >= 1 ? hex : `${hex} (alpha ${c.a})`
}

export function formatValue(key, value) {
  return PROPERTIES[key].kind === COLOR ? formatColor(value) : String(value)
}

/**
 * Evaluate one expectation against one observation.
 * Returns null on success, or a failure record.
 */
export function evaluate(key, expected, observation, tolerance) {
  const spec = PROPERTIES[key]
  const actual = observation[spec.read]
  if (actual === undefined || actual === null || actual === '') {
    return {
      property: key,
      expected: formatValue(key, expected),
      actual: '<not present on the rendered element>',
    }
  }
  if (spec.compare(expected, actual, tolerance)) return null
  return {
    property: key,
    expected: formatValue(key, expected),
    actual: formatValue(key, actual),
  }
}
