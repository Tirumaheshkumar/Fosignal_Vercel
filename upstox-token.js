export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { code } = req.body;

    const API_KEY    = process.env.UPSTOX_API_KEY;
    const API_SECRET = process.env.UPSTOX_API_SECRET;
    const REDIRECT   = process.env.UPSTOX_REDIRECT_URI;

    const params = new URLSearchParams({
      code,
      client_id:     API_KEY,
      client_secret: API_SECRET,
      redirect_uri:  REDIRECT,
      grant_type:    "authorization_code"
    });

    const response = await fetch("https://api.upstox.com/v2/login/authorization/token", {
      method:  "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept":        "application/json"
      },
      body: params.toString()
    });

    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
