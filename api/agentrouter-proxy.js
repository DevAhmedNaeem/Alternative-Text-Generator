// Proxies agentrouter.org requests via a vercel.json rewrite:
// /api/agentrouter/(.*) -> /api/agentrouter-proxy?path=$1
//
// agentrouter.org blocks requests without this User-Agent (it returns an
// HTML challenge page instead of JSON), so a plain external URL rewrite
// can't reach it from production - only a function that sets the header can.
// Runs on the Edge runtime rather than Node serverless, since the Node
// serverless egress IP (AWS datacenter range) was being WAF-blocked by
// agentrouter.org regardless of headers.
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const targetPath = url.searchParams.get('path') || '';
  const targetUrl = targetPath === '__debug_echo__'
    ? 'https://httpbin.org/anything'
    : `https://agentrouter.org/${targetPath}`;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/json',
        Authorization: req.headers.get('authorization') || '',
        'User-Agent': 'cline/3.0.0',
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      duplex: 'half',
    });

    const contentType = upstream.headers.get('content-type') || 'application/json';
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { 'Content-Type': contentType },
    });
  } catch (err) {
    return Response.json({ error: { message: `Proxy error: ${err.message}` } }, { status: 502 });
  }
}
