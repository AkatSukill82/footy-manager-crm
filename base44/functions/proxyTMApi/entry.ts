/**
 * Proxy server-side pour l'API Transfermarkt (https://transfermarkt-api.fly.dev)
 * Toujours retourner HTTP 200 — base44.functions.invoke throw sur tout autre status.
 * Les erreurs sont dans le corps : { error: "..." }
 */
Deno.serve(async (req) => {
  let path = "";
  try {
    const body = await req.json();
    path = body?.path || "";

    if (!path) {
      return Response.json({ error: "path manquant" });
    }

    // Reconstruct clean URL (path already contains encoded query string)
    const url = `https://transfermarkt-api.fly.dev${path}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    let tmRes;
    try {
      tmRes = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!tmRes.ok) {
      const body = await tmRes.text().catch(() => "");
      return Response.json({ error: `TM API ${tmRes.status}: ${body.slice(0, 200)}` });
    }

    const data = await tmRes.json();
    return Response.json(data);

  } catch (err) {
    const msg = err?.name === "AbortError"
      ? "Timeout: l'API Transfermarkt n'a pas répondu à temps"
      : (err?.message || "Erreur inconnue");
    return Response.json({ error: msg });
  }
});
