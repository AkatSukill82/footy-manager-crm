/**
 * Cherche automatiquement une photo/logo pour un joueur ou un club.
 * Sources (par ordre de priorité) :
 *   1. Google Custom Search Images API (principale)
 *   2. TheSportsDB (fallback)
 *   3. Wikipedia (fallback)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_IMAGES_API_KEY") ?? "AIzaSyBVyh5HP74zd7-9X2rX7-EKJzrDbRMIjqg";
const GOOGLE_CX      = Deno.env.get("GOOGLE_IMAGES_CX") ?? "b38b599e609294a66";

async function searchGoogleImage(query: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      q: query,
      searchType: 'image',
      key: GOOGLE_API_KEY,
      cx: GOOGLE_CX,
      num: '3',
      imgSize: 'medium',
      safe: 'active',
    });
    const res = await fetch(`https://customsearch.googleapis.com/customsearch/v1?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.link ?? null;
  } catch {
    return null;
  }
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
      // ── 1. Google Images (principale) ────────────────────────────────────
      const googleQuery = club
        ? `"${name}" ${club} football player`
        : `"${name}" footballer football player`;
      photoUrl = await searchGoogleImage(googleQuery);
      if (photoUrl) sources.push('Google Images');

      // ── 2. TheSportsDB (fallback) ─────────────────────────────────────────
      if (!photoUrl) {
        try {
          const res = await fetch(
            `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          if (res.ok) {
            const data = await res.json();
            const player = data?.players?.[0];
            if (player?.strThumb) { photoUrl = player.strThumb; sources.push('TheSportsDB'); }
            else if (player?.strCutout) { photoUrl = player.strCutout; sources.push('TheSportsDB'); }
          }
        } catch (e) { console.error('TheSportsDB:', e.message); }
      }

      // ── 3. Wikipedia (fallback) ───────────────────────────────────────────
      if (!photoUrl) {
        try {
          const res = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
            { headers: { 'User-Agent': 'FDM-App/1.0' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.thumbnail?.source) {
              photoUrl = data.thumbnail.source.replace(/\/\d+px-/, '/400px-');
              sources.push('Wikipedia');
            }
          }
        } catch (e) { console.error('Wikipedia:', e.message); }
      }

    } else if (type === 'club') {
      // ── 1. Google Images (principale) ────────────────────────────────────
      photoUrl = await searchGoogleImage(`"${name}" football club logo écusson`);
      if (photoUrl) sources.push('Google Images');

      // ── 2. TheSportsDB (fallback) ─────────────────────────────────────────
      if (!photoUrl) {
        try {
          const res = await fetch(
            `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(name)}`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          if (res.ok) {
            const data = await res.json();
            const team = data?.teams?.[0];
            if (team?.strTeamBadge) { photoUrl = team.strTeamBadge + '/preview'; sources.push('TheSportsDB'); }
            else if (team?.strTeamLogo) { photoUrl = team.strTeamLogo; sources.push('TheSportsDB'); }
          }
        } catch (e) { console.error('TheSportsDB club:', e.message); }
      }

      // ── 3. Wikipedia (fallback) ───────────────────────────────────────────
      if (!photoUrl) {
        try {
          const res = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name + ' F.C.')}`,
            { headers: { 'User-Agent': 'FDM-App/1.0' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.thumbnail?.source) {
              photoUrl = data.thumbnail.source.replace(/\/\d+px-/, '/200px-');
              sources.push('Wikipedia');
            }
          }
        } catch { /* try without F.C. */
          try {
            const res2 = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
              { headers: { 'User-Agent': 'FDM-App/1.0' } }
            );
            if (res2.ok) {
              const data2 = await res2.json();
              if (data2?.thumbnail?.source) {
                photoUrl = data2.thumbnail.source.replace(/\/\d+px-/, '/200px-');
                sources.push('Wikipedia');
              }
            }
          } catch { /* silent */ }
        }
      }
    }

    if (!photoUrl) {
      return Response.json({ success: false, error: 'No photo found', sources });
    }

    return Response.json({ success: true, photo_url: photoUrl, sources });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
