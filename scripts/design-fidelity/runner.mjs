import { FidelityError } from './errors.mjs'
import { observe, resolveCssExpression } from './observe.mjs'
import { openPage } from './page.mjs'
import { evaluate } from './properties.mjs'
import { fingerprintFiles } from './snapshot.mjs'

export async function runSnapshot({ snapshot, browser, baseUrl, repoRoot }) {
  const failures = []
  const pending = []
  const notes = []
  let declared = 0
  let executed = 0

  const enforcedFrames = snapshot.frames.filter((f) => f.status === 'enforced')
  const pendingFrames = snapshot.frames.filter((f) => f.status !== 'enforced')

  declared += snapshot.tokens.length
  for (const frame of enforcedFrames) {
    for (const el of frame.elements) declared += Object.keys(el.expect).length
  }

  // Every (route, theme) combination the snapshot needs, opened once.
  const contexts = new Map()
  const need = (route, theme) =>
    contexts.set(`${theme} ${route}`, { route, theme })
  for (const t of snapshot.tokens) need(t.route, t.theme)
  for (const f of snapshot.frames) need(f.route, f.theme)

  /** element observations, keyed `${frameId}::${elementId}`, for the paired-asset pass */
  const observed = new Map()

  for (const { route, theme } of contexts.values()) {
    const themeConfig = snapshot.themes[theme]
    const page = await openPage(browser, {
      baseUrl,
      route,
      theme,
      themeConfig,
      viewport: snapshot.viewport,
    })
    try {
      for (const token of snapshot.tokens) {
        if (token.route !== route || token.theme !== theme) continue
        const actual = await resolveCssExpression(page, token.cssExpression)
        executed += 1
        const failure = evaluate(
          'backgroundColor',
          token.expect,
          { backgroundColor: actual },
          token.tolerance ?? 0
        )
        if (failure) {
          failures.push({
            scope: `token ${token.id}`,
            figmaNode: token.figmaNode,
            evidence: token.figmaEvidence,
            route,
            theme,
            selector: token.cssExpression,
            file: token.implementedIn,
            property:
              failure.property === 'backgroundColor'
                ? 'value'
                : failure.property,
            expected: failure.expected,
            actual: failure.actual,
          })
        }
      }

      for (const frame of enforcedFrames) {
        if (frame.route !== route || frame.theme !== theme) continue
        for (const el of frame.elements) {
          const records = await observe(page, el.selector)
          const wanted = el.matchCount ?? 1
          if (records.length !== wanted) {
            throw new FidelityError(
              `frames.${frame.id}.elements.${el.id}: selector ${JSON.stringify(el.selector)} matched ${records.length} element(s) on ${route} [${theme}], expected exactly ${wanted}.`,
              `Figma node ${el.figmaNode}. Fix the selector or the markup in ${el.implementedIn}; a selector that matches nothing must never pass quietly.`
            )
          }
          const record = records[0]
          if (!record.rendered) {
            throw new FidelityError(
              `frames.${frame.id}.elements.${el.id}: ${JSON.stringify(el.selector)} matched an element that is not rendered (zero-sized, hidden or fully transparent) on ${route} [${theme}].`,
              `Figma node ${el.figmaNode}, implemented in ${el.implementedIn}.`
            )
          }
          observed.set(`${frame.id}::${el.id}`, record)
          for (const [property, expectedValue] of Object.entries(el.expect)) {
            executed += 1
            const failure = evaluate(
              property,
              expectedValue,
              record,
              el.tolerance ?? 0
            )
            if (failure) {
              failures.push({
                scope: `${frame.id} / ${el.id}`,
                figmaNode: el.figmaNode,
                evidence: el.figmaName,
                route,
                theme,
                selector: el.selector,
                file: el.implementedIn,
                ...failure,
              })
            }
          }
        }
      }

      for (const frame of pendingFrames) {
        if (frame.route !== route || frame.theme !== theme) continue
        const actualHash = fingerprintFiles(
          repoRoot,
          frame.implementationFingerprint.files
        )
        if (actualHash !== frame.implementationFingerprint.sha256) {
          failures.push({
            scope: `${frame.id} (awaiting-implementation)`,
            figmaNode: frame.figmaNode,
            evidence: frame.figmaName,
            route,
            theme,
            selector: '(implementation fingerprint)',
            file: frame.implementationFingerprint.files.join(', '),
            property: 'implementationFingerprint.sha256',
            expected: frame.implementationFingerprint.sha256,
            actual: `${actualHash} — these files changed while ${frame.elements.length} element assertions for node ${frame.figmaNode} are still switched off. Implement the frame and set status to "enforced", or re-baseline the digest deliberately in design/figma/snapshot.json.`,
          })
        }
        pending.push({
          frame: frame.id,
          figmaNode: frame.figmaNode,
          route,
          theme,
          assertions: frame.elements.reduce(
            (n, el) => n + Object.keys(el.expect).length,
            0
          ),
        })
      }
    } finally {
      await page.close()
    }
  }

  // Distinct artwork per theme.
  for (const pair of snapshot.themePairedAssets) {
    const missing = pair.refs.filter(
      (r) => !observed.has(`${r.frame}::${r.element}`)
    )
    if (missing.length) {
      notes.push(
        `paired asset "${pair.id}" not compared: ${missing.map((r) => `${r.frame}/${r.element}`).join(', ')} belong to a frame that is still awaiting-implementation.`
      )
      continue
    }
    declared += 1
    executed += 1
    const seen = new Map()
    for (const ref of pair.refs) {
      const record = observed.get(`${ref.frame}::${ref.element}`)
      if (!record.assetPath) {
        throw new FidelityError(
          `themePairedAssets.${pair.id}: ${ref.frame}/${ref.element} resolved to no asset at all.`,
          'The element has no <img> and no background-image, so there is nothing to compare across themes.'
        )
      }
      const previous = seen.get(record.assetPath)
      if (previous) {
        failures.push({
          scope: `themePairedAssets / ${pair.id}`,
          figmaNode: Object.values(pair.figmaNodes ?? {}).join(' vs '),
          evidence: pair.description,
          route: '(cross-theme)',
          theme: `${previous.frame} vs ${ref.frame}`,
          selector: `${previous.element} / ${ref.element}`,
          file: pair.implementedIn ?? '(see the two frames)',
          property: 'assetPath',
          expected:
            'a different file per theme — the design draws this artwork separately for light and dark',
          actual: `both themes loaded ${record.assetPath}`,
        })
      } else {
        seen.set(record.assetPath, ref)
      }
    }
  }

  if (executed !== declared) {
    throw new FidelityError(
      `harness executed ${executed} assertions but the snapshot declares ${declared}.`,
      'Something was skipped. A partial run must not be reported as a pass.'
    )
  }

  return { failures, pending, notes, declared, executed }
}
