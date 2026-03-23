export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing code parameter' });

    const API_KEY    = process.env.UPSTOX_API_KEY;
    const API_SECRET = process.env.UPSTOX_API_SECRET;
    const REDIRECT   = process.env.UPSTOX_REDIRECT_URI;

    if (!API_KEY || !API_SECRET || !REDIRECT) {
      console.error('Missing env vars:', { hasKey: !!API_KEY, hasSecret: !!API_SECRET, hasRedirect: !!REDIRECT });
      return res.status(500).json({ error: 'Server config error — check Vercel environment variables' });
    }

    const params = new URLSearchParams({
      code,
      client_id:     API_KEY,
      client_secret: API_SECRET,
      redirect_uri:  REDIRECT,
      grant_type:    'authorization_code',
    });

    const response = await fetch('https://api.upstox.com/v2/login/authorization/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: params.toString(),
    });

    const data = await response.json();
    return res.status(response.ok ? 200 : response.status).json(data);

  } catch (err) {
    console.error('upstox-token error:', err);
    return res.status(500).json({ error: err.message });
  }
}
