import { checkRateLimit } from '@/lib/rate-limit'
import { validateSearchQuery } from '@/lib/validation'
import { getDb } from '@/lib/db'
import type { CityEntry } from '@/types/weather'

export async function GET(request: Request) {
  const { allowed } = checkRateLimit(request)
  if (!allowed) return Response.json({ error: 'Rate limit exceeded', code: 1002 }, { status: 429 })

  const { searchParams } = new URL(request.url)
  const q = validateSearchQuery(searchParams.get('q'))
  if (!q) return Response.json({ error: 'Invalid query parameter', code: 1004 }, { status: 400 })

  const db = getDb()
  const rows = db
    .prepare(
      `SELECT id, name, country, region, lat, lon, timezone
       FROM cities
       WHERE name LIKE ?
       ORDER BY population DESC
       LIMIT 8`
    )
    .all(q + '%') as CityEntry[]

  return Response.json(rows, { status: 200 })
}
