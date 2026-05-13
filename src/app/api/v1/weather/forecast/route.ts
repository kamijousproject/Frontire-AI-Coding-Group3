import { checkRateLimit } from '@/lib/rate-limit'
import { validateCoordParam } from '@/lib/validation'
import { fetchForecast } from '@/lib/weatherapi'
import type { ForecastDay } from '@/types/weather'

export async function GET(request: Request) {
  const { allowed } = checkRateLimit(request)
  if (!allowed) return Response.json({ error: 'Rate limit exceeded', code: 1002 }, { status: 429 })

  const { searchParams } = new URL(request.url)
  const rawQ = searchParams.get('q') ?? ''
  const parts = rawQ.split(',')
  if (parts.length !== 2) {
    return Response.json({ error: 'Invalid query parameter', code: 1004 }, { status: 400 })
  }

  const lat = validateCoordParam(parts[0].trim(), -90, 90)
  const lon = validateCoordParam(parts[1].trim(), -180, 180)
  if (lat === null || lon === null) {
    return Response.json({ error: 'Invalid query parameter', code: 1004 }, { status: 400 })
  }

  const coordKey = `${lat.toFixed(4)},${lon.toFixed(4)}`

  try {
    const data: ForecastDay[] = await fetchForecast(coordKey)
    return Response.json(data, { status: 200 })
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string }
    const code = e.code ?? 1003
    const status = code === 1001 ? 404 : code === 1002 ? 429 : 503
    return Response.json({ error: e.message ?? 'Upstream error', code }, { status })
  }
}
