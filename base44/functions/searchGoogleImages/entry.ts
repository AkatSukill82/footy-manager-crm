/**
 * Recherche d'images via Google Custom Search API.
 * Les clés API restent côté serveur (jamais exposées au client).
 *
 * Env vars requises :
 *   GOOGLE_IMAGES_API_KEY  → console.cloud.google.com > Credentials
 *   GOOGLE_IMAGES_CX       → cse.google.com > Votre moteur > ID
 *
 * Usage : base44.functions.invoke("searchGoogleImages", {
 *   query: "Kylian Mbappé Real Madrid",
 *   type: "player" | "club"
 * })
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_IMAGES_API_KEY") ?? "";
const GOOGLE_CX      = Deno.env.get("GOOGLE_IMAGES_CX") ?? "";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query, type } = await req.json();
    if (!query) return Response.json({ error: 'query required' }, { status: 400 });

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      return Response.json(
        { error: 'Google Images API non configurée. Ajoutez GOOGLE_IMAGES_API_KEY et GOOGLE_IMAGES_CX dans les variables d\'environnement.' },
        { status: 503 }
      );
    }

    // Requête optimisée selon le type
    let searchQuery = query;
    if (type === 'player') {
      searchQuery = `"${query}" footballer joueur football`;
    } else if (type === 'club') {
      searchQuery = `"${query}" football club logo écusson`;
    }

    const params = new URLSearchParams({
      q: searchQuery,
      searchType: 'image',
      key: GOOGLE_API_KEY,
      cx: GOOGLE_CX,
      num: '8',
      imgSize: 'medium',
      safe: 'active',
    });

    const res = await fetch(`https://customsearch.googleapis.com/customsearch/v1?${params}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Response.json(
        { error: err?.error?.message || `Google API error ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const items = (data.items ?? []).map((item: any) => ({
      url:       item.link,
      thumbnail: item.image?.thumbnailLink ?? item.link,
      source:    item.displayLink,
      title:     item.title,
      width:     item.image?.width,
      height:    item.image?.height,
    }));

    return Response.json({ success: true, items, total: data.searchInformation?.totalResults });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
