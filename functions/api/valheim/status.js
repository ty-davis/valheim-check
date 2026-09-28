export async function onRequestGet({ env }) {
  if (!env.VALHEIM_STATUS_URL) {
    return Response.json(
      { error: 'VALHEIM_STATUS_URL is not configured.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const headers = { Accept: 'application/json' }
  if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
    headers['CF-Access-Client-Id'] = env.CF_ACCESS_CLIENT_ID
    headers['CF-Access-Client-Secret'] = env.CF_ACCESS_CLIENT_SECRET
  }

  try {
    const upstream = await fetch(env.VALHEIM_STATUS_URL, {
      headers,
      signal: AbortSignal.timeout(8000),
      cf: { cacheTtl: 10, cacheEverything: true },
    })

    if (!upstream.ok) {
      return Response.json(
        { error: 'Valheim status upstream unavailable.', upstreamStatus: upstream.status },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const body = await upstream.text()
    // Preserve the Steam ID's full integer precision in the JSON response.
    const status = JSON.parse(body.replace(/("steam_id"\s*:\s*)(\d+)/, '$1"$2"'))
    return Response.json(status, {
      headers: { 'Cache-Control': 'public, max-age=10, s-maxage=10' },
    })
  } catch {
    return Response.json(
      { error: 'Could not fetch or parse the Valheim status upstream.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
