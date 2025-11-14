/**
 * This API endpoint is invoked by GitHub Actions to aggregate all raw analytics shards
 * for a given month into a single gzipped NDJSON file stored in blob storage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { list, put } from '@vercel/blob'

export const runtime = 'nodejs'

const TOKEN = process.env.DRAIN_TOKEN

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new NextResponse('Method not allowed', { status: 405 })
  }

  // Check token from query param
  const token = req.nextUrl.searchParams.get('token')
  if (token !== TOKEN) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const now = new Date()
    const y = now.getUTCFullYear()
    const m = now.getUTCMonth() // 0-11
    const last = new Date(Date.UTC(y, m - 1, 1))
    const monthArg = req.nextUrl.searchParams.get('month') // Optional YYYY-MM
    const yyyy = monthArg ? monthArg.split('-')[0] : last.getUTCFullYear()
    const mm = monthArg
      ? monthArg.split('-')[1]
      : String(last.getUTCMonth() + 1).padStart(2, '0')

    const prefix = `analytics/raw/${yyyy}/${mm}/`
    const archiveKey = `analytics/monthly/${yyyy}-${mm}.ndjson.gz`

    // List all shards under the month prefix
    const all = []
    let cursor
    do {
      // @ts-ignore - res type not inferred
      const res = await list({ prefix, limit: 1000, cursor })
      all.push(...res.blobs)
      cursor = res.cursor
    } while (cursor)

    if (!all.length) {
      console.log('No shards found for', `${yyyy}-${mm}`)
      return NextResponse.json({ ok: true, message: 'No shards found' })
    }

    // Collect all shard contents
    const contents = []
    for (const b of all) {
      const response = await fetch(b.url)
      const text = await response.text()
      contents.push(text)
    }
    const combined = contents.join('\n') + '\n'

    // Gzip the combined content
    const zlib = await import('zlib')
    const compressed = zlib.gzipSync(combined)

    // Upload the gzipped data
    const { url } = await put(archiveKey, compressed as Buffer, {
      access: 'public',
      contentType: 'application/gzip',
    })

    console.log('Wrote:', url)
    return NextResponse.json({ ok: true, url })
  } catch (error) {
    console.error('Failed to create monthly dump:', error)
    return NextResponse.json(
      { ok: false, error: 'Dump failed' },
      { status: 500 }
    )
  }
}
