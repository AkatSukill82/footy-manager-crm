/**
 * Proxy server-side pour l'API SofaScore (api.sofascore.com).
 * Les headers Referer/Origin sont obligatoires — SofaScore les vérifie.
 * Toujours retourner HTTP 200 — base44.functions.invoke throw sur tout autre status.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SS_BASE = "https://api.sofascore.com/api/v1";
const TIMEOUT = 12000;

function isValidPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.includes("..") || path.includes("://")) return false;
  if (/[\x00-\x1f\x7f]/.test(path)) return false;
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const path: string = body?.path || "";

    if (!path) return Response.json({ error: "path manquant" });
    if (!isValidPath(path)) return Response.json({ error: "path invalide" });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    let ssRes: Response;
    try {
      ssRes = await fetch(`${SS_BASE}${path}`, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://www.sofascore.com/",
          "Origin": "https://www.sofascore.com",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!ssRes.ok) {
      const text = await ssRes.text().catch(() => "");
      return Response.json({ error: `SofaScore ${ssRes.status}: ${text.slice(0, 200)}` });
    }

    const data = await ssRes.json();
    return Response.json(data);

  } catch (err: any) {
    const msg = err?.name === "AbortError"
      ? "Timeout: SofaScore n'a pas répondu à temps"
      : (err?.message || "Erreur inconnue");
    return Response.json({ error: msg });
  }
});
