/**
 * Proxy SofaScore — stats joueur saison en cours (JSON API non-officielle).
 *
 * Actions :
 *   searchAndGetStats  — recherche joueur par nom puis stats saison agrégées
 *   getStats           — stats depuis un ID SofaScore connu
 */

const SS_BASE = "https://www.sofascore.com/api/v1";

const SS_HEADERS: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.sofascore.com/",
  "Origin": "https://www.sofascore.com",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "Cache-Control": "no-cache",
};

const ssGet = async (path: string) => {
  const res = await fetch(`${SS_BASE}${path}`, {
    headers: SS_HEADERS,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`SofaScore HTTP ${res.status} — ${path}`);
  return res.json();
};

// ── Recherche joueur ──────────────────────────────────────────────────────────

const searchPlayer = async (name: string, club?: string): Promise<{ id: number; name: string } | null> => {
  const json = await ssGet(`/search/all?q=${encodeURIComponent(name)}`);
  const entries = (json.results || []).filter((r: any) => r.type === "player");
  if (entries.length === 0) return null;

  // Matching par club si fourni
  if (club) {
    const hit = entries.find((r: any) =>
      (r.entity?.team?.name || "").toLowerCase().includes(club.toLowerCase().split(" ")[0])
    );
    if (hit) return { id: hit.entity.id, name: hit.entity.name };
  }

  return { id: entries[0].entity.id, name: entries[0].entity.name };
};

// ── Stats saison en cours (agrégé toutes compétitions) ───────────────────────

const CURRENT_YEAR = 2025;

const getSeasonStats = async (playerId: number): Promise<Record<string, any>> => {
  const json = await ssGet(`/player/${playerId}/statistics`);
  const seasons: any[] = json.seasons || [];

  // Filtrer la saison courante (2025-26)
  const current = seasons.filter((s: any) =>
    s.startYear === CURRENT_YEAR ||
    (typeof s.year === "string" && s.year.startsWith("25"))
  );

  // Si pas de données 2025-26, prendre la saison la plus récente
  const pool = current.length > 0 ? current : seasons.slice(0, 10);

  const sum: Record<string, number> = {};
  const ratings: number[] = [];

  for (const s of pool) {
    const st = s.statistics;
    if (!st) continue;
    for (const [k, v] of Object.entries(st)) {
      if (typeof v !== "number" || k === "type" || k === "id" || k === "countRating") continue;
      if (k === "rating") { ratings.push(v); continue; }
      if (k === "totalRating") continue;
      // Ne pas sommer les pourcentages (moyenne)
      if (k.endsWith("Percentage") || k.endsWith("Pct")) continue;
      sum[k] = (sum[k] ?? 0) + v;
    }
  }

  // Note moyenne
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
    : null;

  const n = (key: string): number | null => {
    const v = sum[key];
    return (v != null && v > 0) ? v : null;
  };
  const f = (key: string): number | null => {
    const v = sum[key];
    return (v != null && v > 0) ? Math.round(v * 100) / 100 : null;
  };

  return {
    matchs_joues:     n("appearances"),
    minutes_jouees:   n("minutesPlayed"),
    buts:             n("goals"),
    passes_decisives: n("assists"),
    cartons_jaunes:   n("yellowCards"),
    cartons_rouges:   n("redCards"),
    tirs:             n("totalShots"),
    tirs_cadres:      n("shotsOnTarget"),
    passes_cles:      n("keyPasses"),
    dribbles_reussis: n("successfulDribbles"),
    tacles:           n("tackles"),
    interceptions:    n("interceptions"),
    xg:               f("expectedGoals"),
    xa:               f("expectedAssists"),
    note_moyenne:     avgRating,
    passes_reussies:  n("accuratePasses"),
    source: "SofaScore",
    sofascore_id: String(playerId),
  };
};

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const { action, query, club, sofascore_id } = await req.json();

    if (action === "searchAndGetStats") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const player = await searchPlayer(query.trim(), club);
      if (!player) return Response.json({ ok: false, error: "Joueur non trouvé sur SofaScore." });
      const stats = await getSeasonStats(player.id);
      return Response.json({ ok: true, player_name: player.name, stats });
    }

    if (action === "getStats") {
      if (!sofascore_id) return Response.json({ ok: false, error: "sofascore_id requis" });
      const stats = await getSeasonStats(parseInt(sofascore_id));
      return Response.json({ ok: true, stats });
    }


    return Response.json({ ok: false, error: `Action inconnue: ${action}` });

  } catch (err: any) {
    console.error("sofascoreProxy:", err.message);
    // HTTP 200 obligatoire : le SDK Base44 throw sur tout status >= 400,
    // ce qui masque le vrai message d'erreur côté client.
    return Response.json({ ok: false, error: err.message });
  }
});
