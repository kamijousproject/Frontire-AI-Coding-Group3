import { checkRateLimit } from '@/lib/rate-limit'
import { validateCoordParam } from '@/lib/validation'
import { fetchLocationByIp, fetchCurrentWeather } from '@/lib/weatherapi'
import type { WeatherData } from '@/types/weather'

export async function GET(request: Request) {
  const { allowed } = checkRateLimit(request)
  if (!allowed) return Response.json({ error: 'Rate limit exceeded', code: 1002 }, { status: 429 })

  const { searchParams } = new URL(request.url)
  const latParam = searchParams.get('lat')
  const lonParam = searchParams.get('lon')

  // If lat/lon provided, use them to fetch weather (reverse geocoding via weatherapi)
  if (latParam !== null && lonParam !== null) {
    const lat = validateCoordParam(latParam, -90, 90)
    const lon = validateCoordParam(lonParam, -180, 180)
    if (lat === null || lon === null) {
      return Response.json({ error: 'Invalid coordinates', code: 1004 }, { status: 400 })
    }

    const coordKey = `${lat.toFixed(4)},${lon.toFixed(4)}`

    try {
      const data: WeatherData = await fetchCurrentWeather(coordKey)
      return Response.json(data, { status: 200 })
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string }
      const code = e.code ?? 1003
      const status = code === 1001 ? 404 : code === 1002 ? 429 : 503
      return Response.json({ error: e.message ?? 'Upstream error', code }, { status })
    }
  }

  // Otherwise, use IP-based location lookup
  try {
    const location = await fetchLocationByIp('auto:ip')
    const coordKey = `${location.lat.toFixed(4)},${location.lon.toFixed(4)}`
    const data: WeatherData = await fetchCurrentWeather(coordKey)
    return Response.json(data, { status: 200 })
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string }
    const code = e.code ?? 1003
    const status = code === 1002 ? 429 : 503
    return Response.json({ error: e.message ?? 'Unable to detect location', code }, { status })
  }
}
