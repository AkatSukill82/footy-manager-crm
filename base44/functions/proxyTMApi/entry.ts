/**
 * Proxy server-side pour l'API Transfermarkt (https://transfermarkt-api.fly.dev)
 * Toujours retourner HTTP 200 — base44.functions.invoke throw sur tout autre status.
 * Les erreurs sont dans le corps : { error: "..." }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function isValidPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  // Block path traversal and protocol injection
  if (path.includes("..") || path.includes("://")) return false;
  // Only printable ASCII, no control characters
  if (/[\x00-\x1f\x7f]/.test(path)) return false;
  return true;
}

Deno.serve(async (req) => {
  let path = "";
  try {
    // Auth check
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    path = body?.path || "";

    if (!path) {
      return Response.json({ error: "path manquant" });
    }

    if (!isValidPath(path)) {
      return Response.json({ error: "path invalide" });
    }

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
