import { checkRateLimit } from '@/lib/rate-limit'
import { validateCityParam } from '@/lib/validation'
import * as cache from '@/lib/cache'
import { fetchCurrentWeather } from '@/lib/weatherapi'

export async function GET(request: Request) {
  const { allowed } = checkRateLimit(request)
  if (!allowed) return Response.json({ error: 'Rate limit exceeded', code: 1002 }, { status: 429 })

  const { searchParams } = new URL(request.url)
  const city = validateCityParam(searchParams.get('city'))
  if (!city) return Response.json({ error: 'Invalid city parameter', code: 1004 }, { status: 400 })

  const cached = cache.get(city)
  if (cached) return Response.json(cached, { status: 200 })

  try {
    const data = await fetchCurrentWeather(city)
    cache.set(city, data)
    return Response.json(data, { status: 200 })
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string }
    const code = e.code ?? 1003
    const status = code === 1001 ? 404 : code === 1002 ? 429 : 503
    return Response.json({ error: e.message ?? 'Upstream error', code }, { status })
  }
}
