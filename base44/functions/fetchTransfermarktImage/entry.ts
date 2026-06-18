/**
 * Proxy d'image générique : télécharge une image externe côté serveur et la
 * renvoie en data-URL base64. Contourne les blocages CORS/referrer du navigateur
 * (Transfermarkt, SofaScore, etc.).
 *
 * Toujours HTTP 200 — le SDK Base44 throw sur tout status >= 400.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TIMEOUT = 10000;
const MAX_BYTES = 3_000_000; // 3 Mo de garde-fou

// Anti-SSRF : refuse les hôtes internes/réservés (métadonnées cloud, loopback,
// réseaux privés). On exige aussi https pour éviter les cibles internes en http.
function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "metadata.google.internal" || h === "metadata") return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = +m[1], b = +m[2];
    if (a === 10 || a === 127 || a === 0 || a >= 224) return true;       // privé / loopback / multicast
    if (a === 169 && b === 254) return true;                            // link-local (169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true;                   // 172.16/12
    if (a === 192 && b === 168) return true;                            // 192.168/16
    if (a === 100 && b >= 64 && b <= 127) return true;                  // CGNAT 100.64/10
  }
  if (h === "::1" || h === "::" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true; // IPv6 privé/loopback
  return false;
}

Deno.serve(async (req) => {
  try {
    // Auth requise — empêche l'usage anonyme comme proxy ouvert.
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { imageUrl } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return Response.json({ error: "imageUrl invalide" });
    }
    let parsed: URL;
    try { parsed = new URL(imageUrl); } catch { return Response.json({ error: "imageUrl invalide" }); }
    if (parsed.protocol !== "https:") return Response.json({ error: "URL non autorisée (https requis)" });
    if (isBlockedHost(parsed.hostname)) return Response.json({ error: "Hôte non autorisé" });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    let res: Response;
    try {
      res = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "Referer": "https://www.google.com/",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) return Response.json({ error: `Image HTTP ${res.status}` });

    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return Response.json({ error: "La ressource n'est pas une image" });
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return Response.json({ error: "Image trop volumineuse" });

    // ArrayBuffer → base64 (par blocs pour éviter le dépassement de pile)
    const bytes = new Uint8Array(buf);
    let binary = "";
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    const base64 = btoa(binary);

    return Response.json({ dataUrl: `data:${contentType};base64,${base64}` });

  } catch (err: any) {
    const msg = err?.name === "AbortError" ? "Timeout image" : (err?.message || "Erreur inconnue");
    return Response.json({ error: msg });
  }
});
