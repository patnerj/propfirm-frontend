import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side proxy for KYC document fetches.
 * Called by the frontend as: GET /api/kyc-doc?id=3&type=id_doc&token=<bearer>
 *
 * Since both the browser and this API route live on demo.launchapropfirm.com,
 * there is zero CORS exposure. The backend fetch is server-to-server.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id    = searchParams.get('id')
  const type  = searchParams.get('type')
  const token = searchParams.get('token')

  if (!id || !type || !token) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_FXSIM_API ||
    'https://api.launchapropfirm.com/wp-json/fxsim/v1'

  const upstream = `${apiBase.replace(/\/$/, '')}/admin/kyc/${encodeURIComponent(id)}/doc/${encodeURIComponent(type)}`

  let upstreamRes: Response
  try {
    upstreamRes = await fetch(upstream, {
      method: 'GET',
      headers: {
        'Authorization':  `Bearer ${token}`,
        'X-FXSIM-Token': token,
        'Accept': '*/*',
      },
      cache: 'no-store',
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Upstream unreachable', detail: err?.message }, { status: 502 })
  }

  if (!upstreamRes.ok) {
    return NextResponse.json(
      { error: 'Upstream error', status: upstreamRes.status },
      { status: upstreamRes.status },
    )
  }

  const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream'
  const body = await upstreamRes.arrayBuffer()

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type':  contentType,
      'Cache-Control': 'private, no-store',
      'Content-Length': String(body.byteLength),
    },
  })
}
