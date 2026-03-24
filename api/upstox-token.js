export default async function handler(req, res) {
  try {
    // Debug logs
    console.log("ENV CHECK:", {
      key: process.env.UPSTOX_API_KEY,
      redirect: process.env.UPSTOX_REDIRECT_URI
    });

    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
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

    console.log("UPSTOX RESPONSE:", data);

    res.status(200).json(data);

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}
