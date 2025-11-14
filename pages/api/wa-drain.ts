import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'edge'

const TOKEN = process.env.DRAIN_TOKEN

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new NextResponse('Method not allowed', { status: 405 })
  }

  // Basic auth guard that is stored in vercel envs
  const incommingUrl = new URL(req.url)
  if (incommingUrl.searchParams.get('token') !== TOKEN) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const contentType = req.headers.get('content-type') || ''
  let ndjson: string

  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ ok: false }, { status: 400 })
    ndjson =
      (Array.isArray(body) ? body : [body])
        .map((e) => JSON.stringify(e))
        .join('\n') + '\n'
  } else {
    // treat the body as already-formed NDJSON
    ndjson = await req.text()
    if (!ndjson || !ndjson.trim()) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
  }

  // Write small “shard” files to avoid appending/locking
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  const hh = String(now.getUTCHours()).padStart(2, '0')
  const mi = String(now.getUTCMinutes()).padStart(2, '0')
  const ts = `${yyyy}-${mm}-${dd}T${hh}-${mi}Z`

  const key = `analytics/raw/${yyyy}/${mm}/${dd}/${ts}-${crypto.randomUUID()}.ndjson`

  try {
    const { url } = await put(key, ndjson, {
      access: 'public',
      contentType: 'application/x-ndjson',
    })

    // Respond 200 so Vercel considers the drain delivery successful
    return NextResponse.json({ ok: true, url })
  } catch (error) {
    console.error('Failed to upload analytics shard:', error)
    return NextResponse.json(
      { ok: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}
