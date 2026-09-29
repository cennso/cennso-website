/**
 * Opening a page, and proving it actually rendered before anything is asserted against it.
 *
 * A page that 404s, throws, comes back blank, or comes back in the wrong theme is a hard
 * failure — never a run with zero findings. Both the curated pass and the enumerative one
 * go through here, so neither can quietly assert against a page that is not there.
 */
import { FidelityError } from './errors.mjs'

const NAV_TIMEOUT_MS = 30_000

/**
 * Opens one route in one theme and proves it actually rendered before anything
 * is asserted against it. A page that 404s, throws, comes back blank, or comes
 * back in the wrong theme is a hard failure — never a run with zero findings.
 */
export async function openPage(
  browser,
  { baseUrl, route, theme, themeConfig, viewport }
) {
  const page = await browser.newPage()
  const pageErrors = []
  page.on('pageerror', (err) => pageErrors.push(err.message))
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 })
  await page.evaluateOnNewDocument(
    (key, value) => {
      try {
        localStorage.setItem(key, value)
      } catch {
        /* storage disabled — the theme assertion below will catch the fallout */
      }
    },
    themeConfig.storageKey,
    themeConfig.storageValue
  )

  const url = new URL(route, baseUrl).toString()
  let response
  try {
    response = await page.goto(url, {
      waitUntil: 'load',
      timeout: NAV_TIMEOUT_MS,
    })
  } catch (err) {
    await page.close()
    throw new FidelityError(
      `${route} [${theme}] did not render: ${err.message}`,
      {
        hint: `Tried ${url}. Is the site built (yarn build) and the server up?`,
      }
    )
  }
  if (!response) {
    await page.close()
    throw new FidelityError(
      `${route} [${theme}] did not render: no HTTP response from ${url}.`
    )
  }
  if (response.status() >= 400) {
    await page.close()
    throw new FidelityError(
      `${route} [${theme}] did not render: HTTP ${response.status()} from ${url}.`
    )
  }

  try {
    await page.evaluate(() => document.fonts && document.fonts.ready)
  } catch {
    /* no font API — computed font metrics are still readable */
  }

  const state = await page.evaluate(() => ({
    themeAttr: document.documentElement.getAttribute('data-theme'),
    bodyText: (document.body ? document.body.innerText : '').trim().length,
  }))

  if (pageErrors.length) {
    await page.close()
    throw new FidelityError(
      `${route} [${theme}] threw while rendering: ${pageErrors[0]}`,
      'A page that throws can still return HTTP 200. Fix the throw before trusting any assertion on this route.'
    )
  }
  if (state.bodyText === 0) {
    await page.close()
    throw new FidelityError(
      `${route} [${theme}] rendered an empty document body.`
    )
  }
  if (state.themeAttr !== themeConfig.documentAttributeValue) {
    await page.close()
    throw new FidelityError(
      `${route} rendered with data-theme="${state.themeAttr}" but the snapshot asked for "${themeConfig.documentAttributeValue}".`,
      'Every assertion below would have been measured against the wrong palette.'
    )
  }
  return page
}
