// Proxies /api/agentrouter/* to https://agentrouter.org/* on Vercel's server side.
// agentrouter.org blocks requests without this User-Agent (returns an HTML
// challenge page instead of JSON), so a plain vercel.json URL rewrite can't
// reach it from production - only a function that sets the header can.
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const pathParts = req.query.path || [];
  const targetPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;
  const search = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const targetUrl = `https://agentrouter.org/${targetPath}${search}`;

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
