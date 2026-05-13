import { checkRateLimit } from '@/lib/rate-limit'
import { validateCoordPairs } from '@/lib/validation'
import * as cache from '@/lib/cache'
import { fetchCurrentWeather } from '@/lib/weatherapi'
import type { MultiWeatherResult } from '@/types/weather'

export async function GET(request: Request) {
  const { allowed } = checkRateLimit(request)
  if (!allowed) return Response.json({ error: 'Rate limit exceeded', code: 1002 }, { status: 429 })

  const { searchParams } = new URL(request.url)
  const rawCities = searchParams.get('cities')
  const pairs = validateCoordPairs(rawCities)
  if (!pairs) {
    const rawCount = rawCities?.split('|').filter(Boolean).length ?? 0
    const code = rawCount > 10 ? 1005 : 1004
    return Response.json(
      { error: code === 1005 ? 'Max cities exceeded' : 'Invalid cities parameter', code },
      { status: 400 }
    )
  }

  const settled = await Promise.allSettled(
    pairs.map(async ({ lat, lon }): Promise<MultiWeatherResult> => {
      const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`
      const cached = cache.get(cacheKey)
      if (cached) return { ...cached, city: cacheKey }
      try {
        const data = await fetchCurrentWeather(cacheKey)
        cache.set(cacheKey, data)
        // Use coordinate key so frontend can match results
        return { ...data, city: cacheKey }
      } catch (err: unknown) {
        const e = err as { code?: number; message?: string }
        return { type: 'error', city: cacheKey, error: e.message ?? 'Failed', code: e.code ?? 1003 }
      }
    })
  )

  const response: MultiWeatherResult[] = settled.map((r, i) => {
    const { lat, lon } = pairs[i]
    const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`
    return r.status === 'fulfilled'
      ? r.value
      : { type: 'error', city: cacheKey, error: 'Failed to fetch', code: 1003 }
  })

  return Response.json(response, { status: 200 })
}
