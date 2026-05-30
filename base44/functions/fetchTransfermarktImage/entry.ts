/**
 * Proxy image Transfermarkt (côté serveur → évite CORS/referrer).
 * Retourne l'image encodée en base64.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_DOMAINS = [
  "transfermarkt.com",
  "transfermarkt.de",
  "transfermarkt.fr",
  "transfermarkt.co.uk",
  "transfermarkt.es",
  "transfermarkt.it",
  "transfermarkt.us",
  "cdn.transfermarkt.com",
  "img.a.transfermarkt.technology",
  "img.b.transfermarkt.technology",
  "img.c.transfermarkt.technology",
];

function isAllowedUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(d => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    // Auth check — only authenticated base44 users can call this proxy
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return Response.json({ error: 'imageUrl requis' }, { status: 400 });
    }

    if (!isAllowedUrl(imageUrl)) {
      return Response.json({ error: 'URL non autorisée' }, { status: 403 });
    }

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.transfermarkt.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return Response.json({ error: `HTTP ${response.status}` }, { status: 400 });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return Response.json({ error: 'Réponse non-image refusée' }, { status: 400 });
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${contentType};base64,${base64}`;

    // Wrapped in "data" so invoke result matches res.data.dataUrl in TransfermarktImage.jsx
    return Response.json({ data: { dataUrl, contentType } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
