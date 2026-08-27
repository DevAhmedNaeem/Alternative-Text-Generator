// Proxies agentrouter.org requests via a vercel.json rewrite:
// /api/agentrouter/(.*) -> /api/agentrouter-proxy?path=$1
//
// agentrouter.org requires a specific User-Agent header, which only a
// function (not a plain external URL rewrite) can set. Note: agentrouter.org
// also WAF-blocks requests from cloud/datacenter IP ranges (confirmed for
// both Vercel's Node serverless and Edge runtime egress IPs) independent of
// headers, so calls through this proxy may still fail in production even
// with the header set correctly - that block is on agentrouter.org's side.
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const targetPath = url.searchParams.get('path') || '';
  const targetUrl = `https://agentrouter.org/${targetPath}`;

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
