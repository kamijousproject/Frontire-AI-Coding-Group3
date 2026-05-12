import { checkRateLimit } from '@/lib/rate-limit'
import { validateCityParam } from '@/lib/validation'
import { fetchCitySearch } from '@/lib/weatherapi'

export async function GET(request: Request) {
  const { allowed } = checkRateLimit(request)
  if (!allowed) return Response.json({ error: 'Rate limit exceeded', code: 1002 }, { status: 429 })

  const { searchParams } = new URL(request.url)
  const q = validateCityParam(searchParams.get('q'))
  if (!q) return Response.json({ error: 'Invalid query parameter', code: 1004 }, { status: 400 })

  const results = await fetchCitySearch(q)
  return Response.json(results, { status: 200 })
}
