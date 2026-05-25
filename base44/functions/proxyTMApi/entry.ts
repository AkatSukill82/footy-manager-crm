/**
 * Proxy server-side pour l'API Transfermarkt (https://transfermarkt-api.fly.dev)
 * Nécessaire car l'API ne supporte pas le CORS depuis un navigateur.
 * Usage : base44.functions.invoke("proxyTMApi", { path: "/players/search/Messi" })
 */
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const path = body?.path;

    if (!path || typeof path !== "string") {
      return Response.json({ error: "path requis" }, { status: 400 });
    }

    const url = `https://transfermarkt-api.fly.dev${path}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      return Response.json(
        { error: `Transfermarkt API: HTTP ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
