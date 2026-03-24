export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get("code");

    if (!code) {
      return res.status(200).json({ message: "API working, no code yet" });
    }

    const response = await fetch("https://api.upstox.com/v2/login/authorization/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.UPSTOX_API_KEY,
        client_secret: process.env.UPSTOX_API_SECRET,
        redirect_uri: process.env.UPSTOX_REDIRECT_URI,
        grant_type: "authorization_code"
      })
    });

    const data = await response.json();

    return res.status(200).json(data);

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
