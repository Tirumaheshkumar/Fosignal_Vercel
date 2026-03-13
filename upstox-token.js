exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { code } = JSON.parse(event.body);

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

    const resp = await fetch("https://api.upstox.com/v2/login/authorization/token", {
      method:  "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept":        "application/json"
      },
      body: params.toString()
    });

    const data = await resp.json();

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
