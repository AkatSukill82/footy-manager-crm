import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Proxy pour récupérer les images Transfermarkt côté serveur
 * et les retourner en base64 pour éviter les problèmes CORS/referrer
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return Response.json({ error: 'imageUrl requis' }, { status: 400 });
    }

    // Fetch l'image avec les bons headers pour simuler un navigateur
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.transfermarkt.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return Response.json({ error: `HTTP ${response.status}` }, { status: 400 });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Convertir en base64
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${contentType};base64,${base64}`;

    return Response.json({ dataUrl, contentType });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});