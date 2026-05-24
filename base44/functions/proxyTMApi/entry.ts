/**
 * Proxy server-side pour l'API Transfermarkt (https://transfermarkt-api.fly.dev)
 * Évite les problèmes CORS et le proxy Vite (dev-only).
 * Usage : base44.functions.invoke("proxyTMApi", { path: "/players/search/Messi" })
 */
Deno.serve(async (req) => {
  try {
    const { path } = await req.json();
    if (!path || typeof path !== "string") {
      return Response.json({ error: "path requis" }, { status: 400 });
    }

    const url = `https://transfermarkt-api.fly.dev${path}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FDM-Scout/1.0)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return Response.json(
        { error: `Transfermarkt API error: HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
