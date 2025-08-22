
export default async function handler(req: any, res: any) {
  try {
    const path = (req.url || "").replace(/^\/api\/yf-proxy/, "") || "/";
    const url = `https://query1.finance.yahoo.com${path}`;

    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        "User-Agent": req.headers["user-agent"] || "stock-dash",
        Accept: "application/json",
      } as any,
    });

    const body = await upstream.arrayBuffer();
    res.status(upstream.status);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json"
    );
    res.send(Buffer.from(body));
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "proxy failed" });
  }
}