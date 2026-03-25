module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const code        = req.body?.code;
  const API_KEY     = process.env.UPSTOX_API_KEY;
  const API_SECRET  = process.env.UPSTOX_API_SECRET;
  const REDIRECT_URI = process.env.UPSTOX_REDIRECT_URI;

  if (!code)                            return res.status(400).json({ error: 'Missing code' });
  if (!API_KEY || !API_SECRET || !REDIRECT_URI) return res.status(500).json({ error: 'Missing server env vars' });

  const body = new URLSearchParams({
    code, client_id: API_KEY, client_secret: API_SECRET,
    redirect_uri: REDIRECT_URI, grant_type: 'authorization_code'
  });

  const r = await fetch('https://api.upstox.com/v2/login/authorization/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: body.toString()
  });

  const data = await r.json();
  return res.status(r.ok ? 200 : r.status).json(data);
};
