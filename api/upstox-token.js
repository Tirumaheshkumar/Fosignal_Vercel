export default async function handler(req, res) {
  try {
    console.log("START FUNCTION");

    // Step 1: check request
    console.log("REQ URL:", req.url);

    // Step 2: parse URL safely
    let code = null;
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      code = url.searchParams.get("code");
      console.log("CODE:", code);
    } catch (e) {
      console.error("URL PARSE ERROR:", e);
      return res.status(500).json({ error: "URL parse failed", details: e.message });
    }

    // Step 3: env check
    console.log("ENV:", {
      key: process.env.UPSTOX_API_KEY,
      secret: process.env.UPSTOX_API_SECRET ? "present" : "missing",
      redirect: process.env.UPSTOX_REDIRECT_URI
    });

    if (!code) {
      return res.status(200).json({ message: "API working, no code yet" });
    }

    // Step 4: call Upstox
    let response;
    try {
      response = await fetch("https://api.upstox.com/v2/login/authorization/token", {
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
    } catch (e) {
      console.error("FETCH ERROR:", e);
      return res.status(500).json({ error: "Fetch failed", details: e.message });
    }

    // Step 5: parse response
    let data;
    try {
      data = await response.json();
      console.log("UPSTOX RESPONSE:", data);
    } catch (e) {
      console.error("JSON PARSE ERROR:", e);
      return res.status(500).json({ error: "JSON parse failed", details: e.message });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("FINAL ERROR:", error);
    return res.status(500).json({
      error: "Function crashed",
      message: error.message
    });
  }
}
