/**
 * Proxy image Transfermarkt (côté serveur → évite CORS/referrer).
 * Retourne l'image encodée en base64.
 */
Deno.serve(async (req) => {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return Response.json({ error: 'imageUrl requis' }, { status: 400 });
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
