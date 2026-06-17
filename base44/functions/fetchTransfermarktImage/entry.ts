/**
 * Proxy d'image générique : télécharge une image externe côté serveur et la
 * renvoie en data-URL base64. Contourne les blocages CORS/referrer du navigateur
 * (Transfermarkt, SofaScore, etc.).
 *
 * Toujours HTTP 200 — le SDK Base44 throw sur tout status >= 400.
 */

const TIMEOUT = 10000;
const MAX_BYTES = 3_000_000; // 3 Mo de garde-fou

Deno.serve(async (req) => {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string" || !/^https?:\/\//.test(imageUrl)) {
      return Response.json({ error: "imageUrl invalide" });
    }

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
