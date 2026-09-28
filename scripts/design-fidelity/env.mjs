import { spawn } from 'node:child_process'
import { createReadStream, existsSync, statSync } from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'

import { FidelityError } from './errors.mjs'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

/** Chrome, or a hard failure. Never a silent skip. */
export async function launchBrowser() {
  let chromeLauncher
  let puppeteer
  try {
    chromeLauncher = await import('chrome-launcher')
    puppeteer = (await import('puppeteer-core')).default
  } catch (err) {
    throw new FidelityError(
      `the design-fidelity check needs chrome-launcher and puppeteer-core (${err.message}).`,
      'Run yarn install. This check must not be skipped when the browser is missing.'
    )
  }

  let chrome
  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        '--font-render-hinting=none',
      ],
    })
  } catch (err) {
    throw new FidelityError(
      `could not start Chrome: ${err.message}`,
      'Install Google Chrome or set CHROME_PATH. The check fails rather than passing without a browser.'
    )
  }

  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${chrome.port}`,
    defaultViewport: null,
  })
  return {
    browser,
    async close() {
      await browser.disconnect()
      await chrome.kill()
    },
  }
}

/** Minimal static server used by the self-test fixtures. */
export async function startStaticServer(rootDir) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname === '/__broken') {
      res.writeHead(500, { 'content-type': 'text/plain' })
      res.end('deliberate 500')
      return
    }
    const file = path.join(
      rootDir,
      path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, '')
    )
    if (
      !file.startsWith(rootDir) ||
      !existsSync(file) ||
      !statSync(file).isFile()
    ) {
      res.writeHead(404, { 'content-type': 'text/plain' })
      res.end('not found')
      return
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
    })
    createReadStream(file).pipe(res)
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve) => server.close(resolve))
    },
  }
}

/** `next start` against the existing production build. */
export async function startSiteServer({ repoRoot, port, timeoutMs = 90_000 }) {
  if (!existsSync(path.join(repoRoot, '.next', 'BUILD_ID'))) {
    throw new FidelityError('no production build found in .next/.', {
      hint: 'Run yarn build first. yarn check:all does this before the fidelity check.',
    })
  }
  // If something is already listening, the check would silently assert against
  // whatever that is — a stale server from another branch, most likely.
  if (await portAccepts(port)) {
    throw new FidelityError(`port ${port} is already in use.`, {
      hint: 'Stop it, or set DESIGN_FIDELITY_PORT to a free port. The check will not assert against a server it did not start.',
    })
  }

  const bin = path.join(repoRoot, 'node_modules', '.bin', 'next')
  const child = spawn(bin, ['start', '--port', String(port)], {
    cwd: repoRoot,
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const log = []
  child.stdout.on('data', (d) => log.push(String(d)))
  child.stderr.on('data', (d) => log.push(String(d)))

  let exited = null
  child.on('exit', (code) => {
    exited = code
  })

  const baseUrl = `http://127.0.0.1:${port}`
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (exited !== null) {
      throw new FidelityError(
        `next start exited with code ${exited} before serving anything.`,
        log.join('').trim().slice(-2000)
      )
    }
    if (await portAccepts(port)) {
      return {
        baseUrl,
        async close() {
          child.kill('SIGTERM')
          await new Promise((resolve) => {
            const t = setTimeout(() => {
              child.kill('SIGKILL')
              resolve()
            }, 5000)
            child.on('exit', () => {
              clearTimeout(t)
              resolve()
            })
          })
        },
      }
    }
    await delay(250)
  }
  child.kill('SIGKILL')
  throw new FidelityError(
    `next start did not listen on port ${port} within ${timeoutMs}ms.`,
    {
      hint: log.join('').trim().slice(-2000),
    }
  )
}

function portAccepts(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
