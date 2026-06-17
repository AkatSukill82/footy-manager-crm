/**
 * Proxy FotMob — stats joueur saison en cours (JSON API non-officielle).
 *
 * Actions :
 *   searchAndGetStats  — recherche joueur par nom puis stats
 *   getStats           — stats depuis un ID FotMob connu
 */

const FM_BASE = "https://www.fotmob.com/api/data";

const FM_HEADERS: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.fotmob.com/",
  "Origin": "https://www.fotmob.com",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "Cache-Control": "no-cache",
  "x-mas": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
};

const fmGet = async (path: string) => {
  const res = await fetch(`${FM_BASE}${path}`, {
    headers: FM_HEADERS,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`FotMob HTTP ${res.status} — ${path}`);
  return res.json();
};

// ── Recherche joueur ──────────────────────────────────────────────────────────

const searchPlayer = async (name: string, club?: string): Promise<{ id: number; name: string } | null> => {
  const json = await fmGet(`/search/suggest?hits=20&lang=en&term=${encodeURIComponent(name)}`);

  // FotMob retourne un objet avec "all" et "players" (ou similaire)
  const all: any[] = json.all || json.results || [];
  const players = all.filter((r: any) => r.type === "player" || r.teamId != null);
  if (players.length === 0) return null;

  // Matching par club si fourni
  if (club) {
    const hit = players.find((r: any) =>
      (r.teamName || r.club || "").toLowerCase().includes(club.toLowerCase().split(" ")[0])
    );
    if (hit) return { id: hit.id, name: hit.name };
  }

  return { id: players[0].id, name: players[0].name };
};

// ── Stats joueur ──────────────────────────────────────────────────────────────

const STAT_MAP: Record<string, string> = {
  "Goals":          "buts",
  "Assists":        "passes_decisives",
  "Matches":        "matchs_joues",
  "Started":        "titularisations",
  "Minutes played": "minutes_jouees",
  "Rating":         "note_fotmob",
  "Yellow cards":   "cartons_jaunes",
  "Red cards":      "cartons_rouges",
  "Shots":          "tirs",
  "Key passes":     "passes_cles",
  "Dribbles":       "dribbles_reussis",
  "Tackles":        "tacles",
  "Interceptions":  "interceptions",
  "xG":             "xg",
  "xA":             "xa",
};

const getPlayerStats = async (playerId: number): Promise<Record<string, any>> => {
  const json = await fmGet(`/playerData?id=${playerId}`);

  const stats: Record<string, any> = {};

  // Stats ligue principale
  const mainStats: any[] = json.mainLeague?.stats || [];
  for (const item of mainStats) {
    const field = STAT_MAP[item.title];
    if (field && item.value != null) stats[field] = item.value;
  }

  // Additionner les autres compétitions si disponibles
  const otherLeagues: any[] = json.otherLeagues || [];
  for (const league of otherLeagues) {
    for (const item of (league.stats || [])) {
      const field = STAT_MAP[item.title];
      if (field && item.value != null && field !== "note_fotmob") {
        stats[field] = (stats[field] ?? 0) + item.value;
      }
    }
  }

  stats.source    = "FotMob";
  stats.fotmob_id = String(playerId);

  return stats;
};

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const { action, query, club, fotmob_id } = await req.json();

    if (action === "searchAndGetStats") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const player = await searchPlayer(query.trim(), club);
      if (!player) return Response.json({ ok: false, error: "Joueur non trouvé sur FotMob." });
      const stats = await getPlayerStats(player.id);
      return Response.json({ ok: true, player_name: player.name, stats });
    }

    if (action === "getStats") {
      if (!fotmob_id) return Response.json({ ok: false, error: "fotmob_id requis" });
      const stats = await getPlayerStats(parseInt(fotmob_id));
      return Response.json({ ok: true, stats });
    }

    return Response.json({ ok: false, error: `Action inconnue: ${action}` });

  } catch (err: any) {
    console.error("fotmobProxy:", err.message);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
});
