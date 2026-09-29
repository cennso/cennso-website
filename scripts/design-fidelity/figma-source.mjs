/**
 * Parses one committed `get_design_context` dump (design/figma/raw/*.jsx.txt) into a flat
 * list of design nodes.
 *
 * This is the step that makes the harness enumerative rather than curated: nothing here
 * decides which nodes matter. Every node the dump carries comes out, with the style the
 * dump resolved for it. Deciding what to *skip* is a separate, written decision that
 * lives in design/figma/exclusions.json — never a quiet omission here.
 *
 * Two things the parser must get right, because getting them wrong is what produced the
 * defects this rework exists for:
 *
 *  1. **Symbols are expanded.** The dump emits a symbol (Header, Footer, btn_More) as a
 *     function and references it as <Header />. An unexpanded symbol is a picture of a
 *     navigation, which is how an entire nav went unchecked. Every such reference is
 *     spliced in here, so the symbol's text nodes are part of the frame's inventory.
 *  2. **Element opacity is kept, not folded away.** `opacity-41` dims fill *and* border
 *     together. It is recorded as its own property so the comparison can composite it,
 *     instead of comparing a raw fill against a dimmed rendering.
 */
import { FidelityError } from './errors.mjs'

/* ------------------------------------------------------------------ */
/* Tailwind → CSS                                                      */
/* ------------------------------------------------------------------ */

const FONT_WEIGHTS = {
  thin: '100',
  extralight: '200',
  light: '300',
  regular: '400',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
}

const NAMED_COLORS = { white: '#ffffff', black: '#000000' }

/**
 * `leading-[0]` and `text-[0px]` are not design values. The dump emits them on a wrapper
 * whose children carry the real ones, so treating them as real would assert a 0px font.
 */
const DEGENERATE = new Set(['leading-[0]', 'text-[0px]'])

/** Splits a className string into classes, keeping bracketed groups intact. */
export function splitClasses(value) {
  const out = []
  let depth = 0
  let current = ''
  for (const ch of value) {
    if (ch === '[' || ch === '(') depth += 1
    else if (ch === ']' || ch === ')') depth -= 1
    if (/\s/.test(ch) && depth === 0) {
      if (current) out.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current) out.push(current)
  return out
}

function arbitrary(cls, prefix) {
  if (!cls.startsWith(`${prefix}-[`) || !cls.endsWith(']')) return null
  return cls.slice(prefix.length + 2, -1)
}

/**
 * Reads one class into the style/box/geometry record. Unknown classes are ignored on
 * purpose — the dump carries plenty of layout noise (`absolute`, `shrink-0`) that says
 * nothing about the design's values.
 */
function applyClass(cls, out) {
  if (DEGENERATE.has(cls)) return

  // typography
  const font = /^font-\['([^']+)'\]$/.exec(cls)
  if (font) {
    const [family, weightName] = font[1].split(':')
    out.style.fontFamily = family
    if (weightName) {
      const weight = FONT_WEIGHTS[weightName.toLowerCase()]
      if (!weight) {
        throw new FidelityError(
          `unknown Figma font weight "${weightName}" in class ${cls}.`,
          'Add it to FONT_WEIGHTS in scripts/design-fidelity/figma-source.mjs rather than letting it resolve to nothing.'
        )
      }
      out.style.fontWeight = weight
    }
    return
  }
  if (cls === 'italic') out.style.fontStyle = 'italic'
  if (cls === 'not-italic') out.style.fontStyle = 'normal'
  if (cls === 'underline') out.style.textDecorationLine = 'underline'
  if (cls === 'line-through') out.style.textDecorationLine = 'line-through'
  if (cls === 'uppercase') out.style.textTransform = 'uppercase'
  if (cls === 'lowercase') out.style.textTransform = 'lowercase'
  if (cls === 'capitalize') out.style.textTransform = 'capitalize'
  if (cls === 'text-center') out.style.textAlign = 'center'
  if (cls === 'text-right') out.style.textAlign = 'right'
  if (cls === 'text-left') out.style.textAlign = 'left'
  if (cls === 'text-justify') out.style.textAlign = 'justify'

  const tracking = arbitrary(cls, 'tracking')
  if (tracking) out.style.letterSpacing = tracking

  const leading = arbitrary(cls, 'leading')
  if (leading !== null) {
    if (leading === 'normal') out.style.lineHeight = 'normal'
    else if (leading.endsWith('px')) out.style.lineHeight = leading
    else if (/^[\d.]+$/.test(leading))
      out.style.lineHeightRatio = Number(leading)
  }

  // `text-` is overloaded: size, colour or alignment.
  const text = arbitrary(cls, 'text')
  if (text !== null) {
    if (text.endsWith('px')) out.style.fontSize = text
    else if (text.startsWith('#') || text.startsWith('rgb'))
      out.style.color = text
  }
  if (/^text-(white|black)$/.test(cls)) {
    out.style.color = NAMED_COLORS[cls.slice(5)]
  }

  // fill
  const bg = arbitrary(cls, 'bg')
  if (bg !== null) out.box.fill = bg
  if (/^bg-(white|black)$/.test(cls)) out.box.fill = NAMED_COLORS[cls.slice(3)]

  // border
  if (cls === 'border') out.box.borderWidth = '1px'
  const borderWidth = /^border-(\d+)$/.exec(cls)
  if (borderWidth) out.box.borderWidth = `${borderWidth[1]}px`
  const borderColor = arbitrary(cls, 'border')
  if (borderColor !== null && !/^\d/.test(borderColor)) {
    out.box.borderColor = borderColor
    out.box.borderWidth = out.box.borderWidth ?? '1px'
  }
  if (/^border-(white|black)$/.test(cls)) {
    out.box.borderColor = NAMED_COLORS[cls.slice(7)]
    out.box.borderWidth = out.box.borderWidth ?? '1px'
  }

  // radius — Figma's per-corner radii arrive as rounded-tl-[…] and friends.
  const radius = arbitrary(cls, 'rounded')
  if (radius !== null) out.box.borderRadius = radius
  for (const corner of ['tl', 'tr', 'bl', 'br']) {
    const perCorner = arbitrary(cls, `rounded-${corner}`)
    if (perCorner !== null)
      out.box[`borderRadius${corner.toUpperCase()}`] = perCorner
  }

  // opacity: kept as its own value so fill and border can be composited with it.
  const opacity = /^opacity-(\d+)$/.exec(cls)
  if (opacity) out.box.opacity = Number(opacity[1]) / 100

  // spacing
  const gap = arbitrary(cls, 'gap')
  if (gap !== null) out.box.gap = gap
  const px = arbitrary(cls, 'px')
  if (px !== null) {
    out.box.paddingLeft = px
    out.box.paddingRight = px
  }
  const py = arbitrary(cls, 'py')
  if (py !== null) {
    out.box.paddingTop = py
    out.box.paddingBottom = py
  }
  for (const [cl, prop] of [
    ['pl', 'paddingLeft'],
    ['pr', 'paddingRight'],
    ['pt', 'paddingTop'],
    ['pb', 'paddingBottom'],
  ]) {
    const value = arbitrary(cls, cl)
    if (value !== null) out.box[prop] = value
  }

  // geometry — only absolute px values are usable as a position; percentage insets are
  // relative to a parent this parser does not resolve, so they are left out rather than
  // guessed at.
  for (const [cl, prop] of [
    ['left', 'left'],
    ['top', 'top'],
    ['w', 'width'],
    ['h', 'height'],
  ]) {
    const value = arbitrary(cls, cl)
    if (value !== null && value.endsWith('px')) {
      out.geometry[prop] = Number(value.slice(0, -2))
    }
  }
  const size = arbitrary(cls, 'size')
  if (size !== null && size.endsWith('px')) {
    out.geometry.width = Number(size.slice(0, -2))
    out.geometry.height = Number(size.slice(0, -2))
  }

  // Percentage insets. The tool emits a symbol's children this way, so without resolving
  // them the whole Header and Footer would have no position at all — and a box with no
  // position can never be bridged to the element that renders it. That is precisely the
  // blind spot that let a footer band go unchecked.
  // Tailwind's bare-zero utilities. `left-0` is as much a position as `left-[81px]`, and
  // missing it strands every child of a symbol whose root sits at the frame's edge.
  const zero = /^(left|top|right|bottom)-0$/.exec(cls)
  if (zero) {
    if (zero[1] === 'left') out.geometry.left = 0
    else if (zero[1] === 'top') out.geometry.top = 0
    else out.insets = { ...(out.insets ?? {}), [zero[1]]: '0' }
  }
  if (cls === 'inset-0') {
    out.insets = { top: '0', right: '0', bottom: '0', left: '0' }
  }

  const inset = arbitrary(cls, 'inset')
  if (inset !== null) {
    const parts = inset.split('_')
    const sides =
      parts.length === 4
        ? parts
        : parts.length === 2
          ? [parts[0], parts[1], parts[0], parts[1]]
          : [parts[0], parts[0], parts[0], parts[0]]
    const [top, right, bottom, left] = sides
    out.insets = { top, right, bottom, left }
  }
  for (const [cl, side] of [
    ['top', 'top'],
    ['right', 'right'],
    ['bottom', 'bottom'],
    ['left', 'left'],
  ]) {
    const value = arbitrary(cls, cl)
    if (value !== null && value.endsWith('%')) {
      out.insets = { ...(out.insets ?? {}), [side]: value }
    }
  }
}

/** Resolves one inset side against a parent extent, in px. */
function resolveInset(value, extent) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  if (text === '0') return 0
  if (text.endsWith('%')) {
    if (extent === null || extent === undefined) return null
    return (Number(text.slice(0, -1)) / 100) * extent
  }
  if (text.endsWith('px')) return Number(text.slice(0, -2))
  return null
}

/**
 * Turns a node's own geometry plus its parent's resolved rect into an absolute rect.
 * Anything it cannot resolve stays absent — a guessed rectangle produces confident
 * nonsense, and this harness would rather say "not reached".
 */
export function resolveRect(record, parentRect) {
  const rect = {}
  const g = record.geometry ?? {}
  if (g.left !== undefined) rect.left = (parentRect?.left ?? 0) + g.left
  if (g.top !== undefined) rect.top = (parentRect?.top ?? 0) + g.top
  if (g.width !== undefined) rect.width = g.width
  if (g.height !== undefined) rect.height = g.height

  const insets = record.insets
  if (insets && parentRect) {
    const left = resolveInset(insets.left, parentRect.width)
    const right = resolveInset(insets.right, parentRect.width)
    const top = resolveInset(insets.top, parentRect.height)
    const bottom = resolveInset(insets.bottom, parentRect.height)
    if (
      rect.left === undefined &&
      left !== null &&
      parentRect.left !== undefined
    ) {
      rect.left = parentRect.left + left
    }
    if (
      rect.top === undefined &&
      top !== null &&
      parentRect.top !== undefined
    ) {
      rect.top = parentRect.top + top
    }
    if (
      rect.width === undefined &&
      left !== null &&
      right !== null &&
      parentRect.width !== undefined
    ) {
      rect.width = parentRect.width - left - right
    }
    if (
      rect.height === undefined &&
      top !== null &&
      bottom !== null &&
      parentRect.height !== undefined
    ) {
      rect.height = parentRect.height - top - bottom
    }
  }
  return rect
}

function emptyRecord() {
  return { style: {}, box: {}, geometry: {}, insets: undefined }
}

export function classesToRecord(className) {
  const out = emptyRecord()
  for (const cls of splitClasses(className || '')) applyClass(cls, out)
  return out
}

/* ------------------------------------------------------------------ */
/* JSX tokenising                                                      */
/* ------------------------------------------------------------------ */

/**
 * Reads a tag starting at `<`, respecting quotes, braces and template literals so that
 * `style={{ maskImage: `url("…")` }}` is not mistaken for text.
 * Returns { end, raw }.
 */
function readTag(src, start) {
  let i = start + 1
  let depth = 0
  let quote = null
  while (i < src.length) {
    const ch = src[i]
    if (quote) {
      if (ch === quote) quote = null
      else if (ch === '\\') i += 1
    } else if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
    } else if (ch === '{') depth += 1
    else if (ch === '}') depth -= 1
    else if (ch === '>' && depth === 0) {
      return { end: i + 1, raw: src.slice(start, i + 1) }
    }
    i += 1
  }
  throw new FidelityError('unterminated JSX tag in the Figma dump.')
}

function attrValue(raw, name) {
  const direct = new RegExp(`${name}="((?:[^"\\\\]|\\\\.)*)"`).exec(raw)
  if (direct) return direct[1]
  // className={className || "…"} — the default the dump gives a symbol's root.
  const fallback = new RegExp(`${name}=\\{[^}]*?\\|\\|\\s*"([^"]*)"`).exec(raw)
  return fallback ? fallback[1] : null
}

/** Decodes the HTML/JSX entities the dump emits. */
function decodeText(value) {
  return value
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\u200b/g, '')
}

/**
 * Pulls the literal text out of a JSX text run. `{`…`}` template literals are text;
 * every other `{…}` expression is code and contributes nothing.
 */
function readTextRun(src, start, stop) {
  let out = ''
  let i = start
  while (i < stop) {
    const ch = src[i]
    if (ch === '{') {
      const tpl = /^\{`((?:[^`\\]|\\.)*)`\}/.exec(src.slice(i))
      if (tpl) {
        out += tpl[1]
        i += tpl[0].length
        continue
      }
      let depth = 0
      while (i < stop) {
        if (src[i] === '{') depth += 1
        else if (src[i] === '}') {
          depth -= 1
          if (depth === 0) {
            i += 1
            break
          }
        }
        i += 1
      }
      continue
    }
    out += ch
    i += 1
  }
  return decodeText(out)
}

/** Advances past a balanced `{…}` expression, respecting quotes and template literals. */
function skipExpression(src, start) {
  let i = start
  let depth = 0
  let quote = null
  while (i < src.length) {
    const ch = src[i]
    if (quote) {
      if (ch === quote) quote = null
      else if (ch === '\\') i += 1
    } else if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
    } else if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return i + 1
    }
    i += 1
  }
  throw new FidelityError('unterminated JSX expression in the Figma dump.')
}

/** Parses one JSX expression into a tree of { tag, className, nodeId, name, children, text }. */
function parseJsx(src) {
  const stack = []
  let root = null
  let i = 0
  let textStart = 0

  const flushText = (to) => {
    if (!stack.length) return
    const text = readTextRun(src, textStart, to)
    if (text.trim()) stack[stack.length - 1].texts.push(text)
  }

  while (i < src.length) {
    // A `{…}` expression is not markup. Skipping it whole is what stops the `<` in
    // {`<  1  2  3  >`} — the use-cases pager — from being read as an opening tag.
    if (src[i] === '{') {
      i = skipExpression(src, i)
      continue
    }
    if (src[i] !== '<') {
      i += 1
      continue
    }
    flushText(i)
    const { end, raw } = readTag(src, i)
    if (raw.startsWith('</')) {
      const done = stack.pop()
      if (!stack.length) root = done
      i = end
      textStart = i
      continue
    }
    const tag = /^<([A-Za-z][\w.]*)/.exec(raw)[1]
    const srcRef = /\bsrc=\{([A-Za-z][\w]*)\}/.exec(raw)
    const node = {
      tag,
      className: attrValue(raw, 'className'),
      nodeId: attrValue(raw, 'data-node-id'),
      name: attrValue(raw, 'data-name'),
      assetRef: srcRef ? srcRef[1] : null,
      children: [],
      texts: [],
    }
    if (stack.length) stack[stack.length - 1].children.push(node)
    if (raw.endsWith('/>')) {
      if (!stack.length) root = node
    } else {
      stack.push(node)
    }
    i = end
    textStart = i
  }
  return root
}

/** Reads the dump's `const imgFoo = "https://…"` block into a name → URL map. */
export function parseAssetConstants(source) {
  const out = {}
  const re = /^const ([A-Za-z][\w]*) = "([^"]+)";$/gm
  let m
  while ((m = re.exec(source))) out[m[1]] = m[2]
  return out
}

/** Splits the dump into its top-level component functions. */
function splitComponents(source) {
  const components = new Map()
  const re = /(?:export default )?function ([A-Za-z][\w]*)\s*\(/g
  const starts = []
  let m
  while ((m = re.exec(source))) starts.push({ name: m[1], at: m.index })
  if (!starts.length) {
    throw new FidelityError(
      'the Figma dump contains no component function.',
      'design/figma/raw/*.jsx.txt must be the code block `get_design_context` returned, unmodified.'
    )
  }
  for (let k = 0; k < starts.length; k += 1) {
    const body = source.slice(
      starts[k].at,
      k + 1 < starts.length ? starts[k + 1].at : source.length
    )
    const open = body.indexOf('return (')
    if (open === -1) continue
    components.set(
      starts[k].name,
      parseJsx(body.slice(open + 'return ('.length))
    )
  }
  const rootName = /export default function ([A-Za-z][\w]*)/.exec(source)
  if (!rootName || !components.has(rootName[1])) {
    throw new FidelityError(
      'the Figma dump has no default-exported frame component.'
    )
  }
  return { components, rootName: rootName[1] }
}

/* ------------------------------------------------------------------ */
/* Flattening                                                          */
/* ------------------------------------------------------------------ */

const MERGEABLE_STYLE = [
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'fontSize',
  'lineHeight',
  'lineHeightRatio',
  'letterSpacing',
  'textTransform',
  'textDecorationLine',
  'textAlign',
  'color',
]

/**
 * A Figma text node can arrive as a wrapper carrying most of the style with one <p> per
 * line carrying the rest (and, where the designer mixed values, carrying different ones).
 * The wrapper's value is the fallback; a value the lines agree on wins; a value they
 * disagree on is recorded as `mixed` and is never asserted, because there is no single
 * design value to assert.
 */
function resolveTextStyle(node) {
  const own = classesToRecord(node.className).style
  const descendants = []
  const walk = (n) => {
    for (const child of n.children) {
      if (child.nodeId) continue // a nested design node of its own
      descendants.push(classesToRecord(child.className).style)
      walk(child)
    }
  }
  walk(node)

  const style = { ...own }
  const mixed = []
  for (const prop of MERGEABLE_STYLE) {
    const values = descendants
      .map((d) => d[prop])
      .filter((v) => v !== undefined)
    if (!values.length) continue
    const distinct = [...new Set(values)]
    if (distinct.length === 1) style[prop] = distinct[0]
    else {
      delete style[prop]
      mixed.push(prop)
    }
  }
  if (style.lineHeightRatio !== undefined && style.fontSize) {
    const size = Number(String(style.fontSize).replace('px', ''))
    style.lineHeight = `${round(size * style.lineHeightRatio)}px`
  }
  delete style.lineHeightRatio
  // Figma's default paragraph alignment is left; the dump only names the others.
  style.textAlign = style.textAlign ?? 'left'
  return { style, mixed }
}

function round(n) {
  return Math.round(n * 100) / 100
}

/**
 * A Figma text node can hold several lines, and the site may render them as one element
 * (a heading that wraps) or as several (three footer links in one text layer). Both are
 * the same thing in Figma, so both readings are recorded: the aggregate text, and the
 * per-line breakdown. The matcher tries the aggregate first and falls back to the lines,
 * which is what stops a three-link footer layer from being permanently "unmatched".
 */
function textLines(node) {
  const lines = []
  for (const child of node.children) {
    if (child.nodeId) continue
    const text = ownText(child)
    if (!text) continue
    // Resolve the line the same way a whole text node is resolved, with the node's own
    // classes as the fallback: a <span> two levels down still carries the real colour.
    const { style } = resolveTextStyle({
      className: `${node.className ?? ''} ${child.className ?? ''}`,
      children: child.children,
      texts: child.texts,
    })
    lines.push({ text, style })
  }
  return lines
}

/** Collects the asset constants a design node draws with, excluding nested design nodes'. */
function ownAssetRefs(node) {
  const refs = node.assetRef ? [node.assetRef] : []
  for (const child of node.children) {
    if (child.nodeId) continue
    refs.push(...ownAssetRefs(child))
  }
  return refs
}

/** Collects the text a design node owns, excluding text that belongs to a nested node. */
function ownText(node) {
  const parts = [...node.texts]
  for (const child of node.children) {
    if (child.nodeId) continue
    parts.push(ownText(child))
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function hasOwnText(node) {
  return ownText(node).length > 0
}

/**
 * Walks the expanded tree and emits one record per node carrying a Figma id.
 * `kind` is "text" when the node owns text, "box" otherwise.
 */
function flatten(root, components) {
  const nodes = []
  const seen = new Map()

  const visit = (node, ancestry) => {
    let current = node
    // A <Header /> style reference is a symbol instance: splice its body in, keeping the
    // instance's own className so the instance geometry is not lost.
    if (components.has(node.tag)) {
      const body = components.get(node.tag)
      current = {
        ...body,
        className: [body.className, node.className].filter(Boolean).join(' '),
      }
    }

    const record = current.nodeId ? buildRecord(current, ancestry, seen) : null
    if (record) nodes.push(record)

    const nextAncestry = record ? [...ancestry, record] : ancestry
    for (const child of current.children) {
      if (record && !child.nodeId && !components.has(child.tag)) {
        // already folded into the parent's text/style
        visitDescendantsOnly(child, nextAncestry)
        continue
      }
      visit(child, nextAncestry)
    }
  }

  const visitDescendantsOnly = (node, ancestry) => {
    for (const child of node.children) {
      if (child.nodeId || components.has(child.tag)) visit(child, ancestry)
      else visitDescendantsOnly(child, ancestry)
    }
  }

  visit(root, [])
  return nodes
}

function buildRecord(node, ancestry, seen) {
  const record = classesToRecord(node.className)
  const parentRect = [...ancestry]
    .reverse()
    .map((a) => a.rect)
    .find((r) => r && r.left !== undefined)
  const rect = resolveRect(record, parentRect)
  const text = ownText(node)
  const kind = text ? 'text' : 'box'
  const occurrence = (seen.get(node.nodeId) ?? 0) + 1
  seen.set(node.nodeId, occurrence)

  const parentFill = [...ancestry]
    .reverse()
    .map((a) => a.box.fill)
    .find(Boolean)

  const out = {
    // `key` is unique within a frame; `figmaNode` is what a failure prints, and repeats
    // when the same symbol child is instantiated more than once.
    key: occurrence === 1 ? node.nodeId : `${node.nodeId}#${occurrence}`,
    figmaNode: node.nodeId,
    occurrence,
    name: node.name ?? undefined,
    kind,
    // `geometry` is the frame-absolute rect, resolved through the parent chain where the
    // dump only gave percentage insets.
    geometry: rect,
    rect,
    box: record.box,
    parentFill,
  }
  const assetRefs = [...new Set(ownAssetRefs(node))]
  if (assetRefs.length) out.assetRefs = assetRefs
  if (kind === 'text') {
    const { style, mixed } = resolveTextStyle(node)
    out.text = text
    out.style = style
    if (mixed.length) out.mixedProperties = mixed
    const lines = textLines(node)
    if (lines.length > 1) {
      out.lines = lines.map((line, i) => {
        const resolved = { ...line.style }
        if (resolved.lineHeightRatio !== undefined && resolved.fontSize) {
          const size = Number(String(resolved.fontSize).replace('px', ''))
          resolved.lineHeight = `${round(size * resolved.lineHeightRatio)}px`
        }
        delete resolved.lineHeightRatio
        resolved.textAlign = resolved.textAlign ?? 'left'
        return { key: `${out.key}:L${i + 1}`, text: line.text, style: resolved }
      })
    }
  }
  return out
}

/**
 * Parses one raw dump into { frameNode, frameName, nodes }.
 * Throws rather than returning an empty list: a dump that yields no nodes means the
 * parser or the file is broken, and must never read as "nothing to check".
 */
export function parseFigmaDump(source, where = 'figma dump') {
  const { components, rootName } = splitComponents(source)
  const root = components.get(rootName)
  // The frame's own component is not a symbol to splice into itself.
  const symbols = new Map(components)
  symbols.delete(rootName)

  const nodes = flatten(root, symbols)
  if (!nodes.length) {
    throw new FidelityError(`${where}: parsed to zero design nodes.`, {
      hint: 'A frame with no nodes would make every coverage number vacuously perfect.',
    })
  }
  const textNodes = nodes.filter((n) => n.kind === 'text')
  if (!textNodes.length) {
    throw new FidelityError(`${where}: parsed to zero text nodes.`, {
      hint: 'Every frame in this design has copy in it. Zero means the parser lost the text, not that the frame is empty.',
    })
  }
  return {
    frameNode: root.nodeId,
    frameName: root.name ?? rootName,
    frameFill: classesToRecord(root.className).box.fill,
    assets: parseAssetConstants(source),
    nodes,
  }
}

export { hasOwnText }
