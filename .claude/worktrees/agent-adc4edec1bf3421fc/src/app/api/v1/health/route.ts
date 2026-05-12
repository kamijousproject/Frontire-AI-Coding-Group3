import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const { allowed } = checkRateLimit(request)
  if (!allowed) {
    return Response.json({ error: 'Rate limit exceeded', code: 1002 }, { status: 429 })
  }
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() }, { status: 200 })
}
