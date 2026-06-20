/**
 * Cherche une photo/logo fiable pour un joueur ou un club.
 *
 * Priorité aux sources PAR IDENTIFIANT (photo garantie de la bonne personne) :
 *   Joueur : 1. FotMob (par ID)  2. Wikipedia  3. Google Images (dernier recours)
 *   Club   : 1. FotMob (logo)    2. Wikipedia  3. Google Images
 *
 * Google Images est rétrogradé en dernier car il renvoie souvent la mauvaise
 * personne / un logo / une image hors-sujet.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Secrets via variables d'environnement uniquement (jamais en dur).
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_IMAGES_API_KEY") ?? "";
const GOOGLE_CX      = Deno.env.get("GOOGLE_IMAGES_CX") ?? "";

const FM = "https://www.fotmob.com/api/data";
const FM_HEADERS: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Referer": "https://www.fotmob.com/",
  "Origin": "https://www.fotmob.com",
};

// Recherche FotMob → liste de suggestions (array de sections)
async function fmSuggest(term: string): Promise<any[]> {
  try {
    const res = await fetch(`${FM}/search/suggest?hits=20&lang=en&term=${encodeURIComponent(term)}`,
      { headers: FM_HEADERS, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = await res.json();
    if (Array.isArray(json)) {
      const sec = json.find((s: any) => s.title?.key === "all") ?? json[0];
      return sec?.suggestions ?? [];
    }
    return json.all ?? json.suggestions ?? [];
  } catch { return []; }
}

// Vérifie qu'une URL renvoie bien une image (pas un 404 / une page d'erreur)
async function urlIsImage(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return false;
    const ct = r.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return false;
    const len = Number(r.headers.get("content-length") || "0");
    return len === 0 || len > 800; // > 800o pour éviter un pixel/placeholder vide
  } catch { return false; }
}

async function searchGoogleImage(query: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      q: query, searchType: 'image', key: GOOGLE_API_KEY, cx: GOOGLE_CX,
      num: '3', imgSize: 'medium', safe: 'active',
    });
    const res = await fetch(`https://customsearch.googleapis.com/customsearch/v1?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.link ?? null;
  } catch { return null; }
}

async function wikipediaImage(title: string, size = 400): Promise<string | null> {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { 'User-Agent': 'FDM-App/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.thumbnail?.source) return data.thumbnail.source.replace(/\/\d+px-/, `/${size}px-`);
    return null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, name, club } = await req.json();
    if (!name || !type) return Response.json({ error: 'name and type required' }, { status: 400 });

    let photoUrl: string | null = null;
    const sources: string[] = [];

    if (type === 'player') {
      // ── 1. FotMob par ID (photo correcte garantie) ──────────────────────────
      try {
        const sugg = await fmSuggest(name);
        let players = sugg.filter((s: any) => s.type === "player" && !s.isCoach);
        if (club) {
          const hint = String(club).toLowerCase().split(" ")[0];
          const hit = players.find((p: any) => (p.teamName || "").toLowerCase().includes(hint));
          if (hit) players = [hit, ...players.filter((p: any) => p !== hit)];
        }
        const id = players[0]?.id;
        if (id) {
          const u = `https://images.fotmob.com/image_resources/playerimages/${id}.png`;
          if (await urlIsImage(u)) { photoUrl = u; sources.push('FotMob'); }
        }
      } catch (e: any) { console.error('FotMob photo:', e.message); }

      // ── 2. Wikipedia ────────────────────────────────────────────────────────
      if (!photoUrl) {
        const w = await wikipediaImage(name, 400);
        if (w) { photoUrl = w; sources.push('Wikipedia'); }
      }

      // ── 3. Google Images (dernier recours) ──────────────────────────────────
      if (!photoUrl) {
        const g = await searchGoogleImage(club ? `"${name}" ${club} football player` : `"${name}" footballer`);
        if (g) { photoUrl = g; sources.push('Google Images'); }
      }

    } else if (type === 'club') {
      // ── 1. FotMob logo par ID ───────────────────────────────────────────────
      try {
        const sugg = await fmSuggest(name);
        const team = sugg.find((s: any) => s.type === "team");
        if (team?.id) {
          const u = `https://images.fotmob.com/image_resources/logo/teamlogo/${team.id}.png`;
          if (await urlIsImage(u)) { photoUrl = u; sources.push('FotMob'); }
        }
      } catch (e: any) { console.error('FotMob logo:', e.message); }

      // ── 2. Wikipedia ────────────────────────────────────────────────────────
      if (!photoUrl) {
        const w = await wikipediaImage(`${name} F.C.`, 200) ?? await wikipediaImage(name, 200);
        if (w) { photoUrl = w; sources.push('Wikipedia'); }
      }

      // ── 3. Google Images (dernier recours) ──────────────────────────────────
      if (!photoUrl) {
        const g = await searchGoogleImage(`"${name}" football club logo écusson`);
        if (g) { photoUrl = g; sources.push('Google Images'); }
      }
    }

    if (!photoUrl) return Response.json({ success: false, error: 'No photo found', sources });
    return Response.json({ success: true, photo_url: photoUrl, sources });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
