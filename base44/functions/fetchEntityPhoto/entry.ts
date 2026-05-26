/**
 * Cherche automatiquement une photo/logo pour un joueur ou un club.
 * Sources : Wikipedia API (Wikimedia) + TheSportsDB + Clearbit (logos clubs)
 * 
 * Usage: base44.functions.invoke("fetchEntityPhoto", { 
 *   type: "player" | "club", 
 *   name: "Erling Haaland",
 *   club?: "Manchester City"  // optionnel, aide la recherche joueur
 * })
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, name, club } = await req.json();
    if (!name || !type) return Response.json({ error: 'name and type required' }, { status: 400 });

    let photoUrl = null;
    const sources = [];

    if (type === 'player') {
      // ── 1. TheSportsDB ───────────────────────────────────────────────
      try {
        const encoded = encodeURIComponent(name);
        const res = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encoded}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        if (res.ok) {
          const data = await res.json();
          const player = data?.players?.[0];
          if (player?.strThumb) {
            photoUrl = player.strThumb;
            sources.push('TheSportsDB');
          } else if (player?.strCutout) {
            photoUrl = player.strCutout;
            sources.push('TheSportsDB');
          }
        }
      } catch (e) {
        console.error('TheSportsDB error:', e.message);
      }

      // ── 2. Wikipedia API ──────────────────────────────────────────────
      if (!photoUrl) {
        try {
          const searchQuery = club ? `${name} footballer` : `${name} soccer player`;
          const searchRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
            { headers: { 'User-Agent': 'FDM-App/1.0' } }
          );
          if (searchRes.ok) {
            const wikiData = await searchRes.json();
            if (wikiData?.thumbnail?.source) {
              // Get higher res version
              const thumbUrl = wikiData.thumbnail.source;
              const highRes = thumbUrl.replace(/\/\d+px-/, '/400px-');
              photoUrl = highRes;
              sources.push('Wikipedia');
            }
          }
        } catch (e) {
          console.error('Wikipedia error:', e.message);
        }
      }

      // ── 3. Wikipedia search fallback ──────────────────────────────────
      if (!photoUrl) {
        try {
          const searchRes = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=400`,
            { headers: { 'User-Agent': 'FDM-App/1.0' } }
          );
          if (searchRes.ok) {
            const data = await searchRes.json();
            const pages = data?.query?.pages;
            if (pages) {
              const page = Object.values(pages)[0];
              if (page?.thumbnail?.source) {
                photoUrl = page.thumbnail.source;
                sources.push('Wikipedia (search)');
              }
            }
          }
        } catch (e) {
          console.error('Wikipedia search error:', e.message);
        }
      }

    } else if (type === 'club') {
      // ── 1. TheSportsDB pour les clubs ─────────────────────────────────
      try {
        const encoded = encodeURIComponent(name);
        const res = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encoded}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        if (res.ok) {
          const data = await res.json();
          const team = data?.teams?.[0];
          if (team?.strTeamBadge) {
            photoUrl = team.strTeamBadge + '/preview';
            sources.push('TheSportsDB');
          } else if (team?.strTeamLogo) {
            photoUrl = team.strTeamLogo;
            sources.push('TheSportsDB');
          }
        }
      } catch (e) {
        console.error('TheSportsDB club error:', e.message);
      }

      // ── 2. Wikipedia pour le logo du club ─────────────────────────────
      if (!photoUrl) {
        try {
          const wikiRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name + ' F.C.')}`,
            { headers: { 'User-Agent': 'FDM-App/1.0' } }
          );
          if (wikiRes.ok) {
            const wikiData = await wikiRes.json();
            if (wikiData?.thumbnail?.source) {
              photoUrl = wikiData.thumbnail.source.replace(/\/\d+px-/, '/200px-');
              sources.push('Wikipedia');
            }
          }
        } catch (e) {
          // try without F.C.
          try {
            const wikiRes2 = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
              { headers: { 'User-Agent': 'FDM-App/1.0' } }
            );
            if (wikiRes2.ok) {
              const wikiData2 = await wikiRes2.json();
              if (wikiData2?.thumbnail?.source) {
                photoUrl = wikiData2.thumbnail.source.replace(/\/\d+px-/, '/200px-');
                sources.push('Wikipedia');
              }
            }
          } catch (_) {}
        }
      }
    }

    if (!photoUrl) {
      return Response.json({ success: false, error: 'No photo found', sources });
    }

    return Response.json({ success: true, photo_url: photoUrl, sources });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});