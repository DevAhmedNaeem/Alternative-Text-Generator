// Proxies agentrouter.org requests on Vercel's server side, reached via a
// vercel.json rewrite: /api/agentrouter/(.*) -> /api/agentrouter-proxy?path=$1
//
// agentrouter.org blocks requests without this User-Agent (it returns an
// HTML challenge page instead of JSON), so a plain external URL rewrite
// can't reach it from production - only a function that sets the header can.
//
// A Vercel [...path].js catch-all folder route was tried first but only
// matched single-segment paths on this project, so a plain function name
// driven by an explicit rewrite is used instead.
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const targetPath = req.query.path || '';
  const targetUrl = `https://agentrouter.org/${targetPath}`;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        Authorization: req.headers['authorization'] || '',
        'User-Agent': 'cline/3.0.0',
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
    });

    const contentType = upstream.headers.get('content-type') || 'application/json';
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: { message: `Proxy error: ${err.message}` } });
  }
}
