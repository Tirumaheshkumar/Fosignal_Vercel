export const config = {
  runtime: 'nodejs'
};
module.module.exports = async function handler
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const code = req.body?.code;
    if (!code) return res.status(400).json({ error: 'Missing code' });
    const KEY = process.env.UPSTOX_API_KEY;
    const SECRET = process.env.UPSTOX_API_SECRET;
    const URI = process.env.UPSTOX_REDIRECT_URI;
    if (!KEY || !SECRET || !URI) return res.status(500).json({ error: 'Missing env vars', debug: { hasKey: !!KEY, hasSecret: !!SECRET, hasRedirect: !!URI } });
    const body = new URLSearchParams({ code, client_id: KEY, client_secret: SECRET, redirect_uri: URI, grant_type: 'authorization_code' });
    const r = await fetch('https://api.upstox.com/v2/login/authorization/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: body.toString()
    });
    const data = await r.json();
    return res.status(r.ok ? 200 : r.status).json(data);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
