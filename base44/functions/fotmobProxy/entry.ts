/**
 * Proxy FotMob — recherche joueurs + stats saison.
 *
 * IMPORTANT — structure réelle de l'endpoint suggest :
 *   FotMob retourne un ARRAY, pas un objet.
 *   Exemple : [{title:{key:"all"}, suggestions:[{type:"player", id:"30893", name:"Ronaldo", teamName:"Al Nassr", teamId:101918}]}]
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
};

const fmGet = async (path: string) => {
  const res = await fetch(`${FM_BASE}${path}`, {
    headers: FM_HEADERS,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`FotMob HTTP ${res.status} — ${path}`);
  return res.json();
};

// ── Parse la réponse suggest (array de sections) ──────────────────────────────

const parseSuggest = (json: any): any[] => {
  // FotMob retourne un array : [{title:{key:"all"}, suggestions:[...]}, {title:{key:"players"}, suggestions:[...]}]
  if (Array.isArray(json)) {
    // Prend la section "all" en priorité, sinon la première section
    const section = json.find((s: any) => s.title?.key === "all") ?? json[0];
    return section?.suggestions ?? [];
  }
  // Fallback si la structure change un jour
  return json.all ?? json.results ?? json.suggestions ?? [];
};

// ── Recherche joueur interne ───────────────────────────────────────────────────

const searchPlayer = async (name: string, club?: string): Promise<{ id: number; name: string } | null> => {
  const json    = await fmGet(`/search/suggest?hits=20&lang=en&term=${encodeURIComponent(name)}`);
  const all     = parseSuggest(json);
  const players = all.filter((r: any) => r.type === "player" && !r.isCoach);
  if (players.length === 0) return null;

  if (club) {
    const hint = club.toLowerCase().split(" ")[0];
    const hit  = players.find((r: any) => (r.teamName ?? "").toLowerCase().includes(hint));
    if (hit) return { id: parseInt(hit.id), name: hit.name };
  }

  return { id: parseInt(players[0].id), name: players[0].name };
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
  const json  = await fmGet(`/playerData?id=${playerId}`);
  const stats: Record<string, any> = {};

  for (const item of (json.mainLeague?.stats ?? [])) {
    const field = STAT_MAP[item.title];
    if (field && item.value != null) stats[field] = item.value;
  }

  for (const league of (json.otherLeagues ?? [])) {
    for (const item of (league.stats ?? [])) {
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

// ── Recherche équipe ──────────────────────────────────────────────────────────

const searchTeam = async (name: string): Promise<any[]> => {
  const json = await fmGet(`/search/suggest?hits=20&lang=en&term=${encodeURIComponent(name)}`);
  const all  = parseSuggest(json);
  return all
    .filter((r: any) => r.type === "team")
    .slice(0, 10)
    .map((r: any) => ({
      id:   r.id,
      nom:  r.name,
      pays: r.ccode ?? r.countryCode ?? null,
      logo: `https://images.fotmob.com/image_resources/logo/teamlogo/${r.id}.png`,
    }));
};

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const { action, query, club, fotmob_id } = await req.json();

    // ── Recherche candidats joueurs ──────────────────────────────────────────
    if (action === "searchPlayer") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const json    = await fmGet(`/search/suggest?hits=20&lang=en&term=${encodeURIComponent(query.trim())}`);
      const all     = parseSuggest(json);
      const players = all
        .filter((r: any) => r.type === "player" && !r.isCoach)
        .slice(0, 10)
        .map((r: any) => ({
          fotmob_id:   String(r.id),
          nom:         r.name,
          club_actuel: r.teamName ?? null,
          photo_url:   `https://images.fotmob.com/image_resources/playerimages/${r.id}.png`,
        }));
      return Response.json({ ok: true, total: players.length, players });
    }

    // ── Stats + recherche en un appel ────────────────────────────────────────
    if (action === "searchAndGetStats") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const player = await searchPlayer(query.trim(), club);
      if (!player) return Response.json({ ok: false, error: "Joueur non trouvé sur FotMob." });
      const stats = await getPlayerStats(player.id);
      return Response.json({ ok: true, player_name: player.name, stats });
    }

    // ── Stats depuis ID connu ────────────────────────────────────────────────
    if (action === "getStats") {
      if (!fotmob_id) return Response.json({ ok: false, error: "fotmob_id requis" });
      const stats = await getPlayerStats(parseInt(fotmob_id));
      return Response.json({ ok: true, stats });
    }

    // ── Recherche équipe ─────────────────────────────────────────────────────
    if (action === "searchTeam") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const teams = await searchTeam(query.trim());
      return Response.json({ ok: true, total: teams.length, teams });
    }

    return Response.json({ ok: false, error: `Action inconnue: ${action}` });

  } catch (err: any) {
    console.error("fotmobProxy:", err.message);
    // HTTP 200 obligatoire : le SDK Base44 throw sur tout status >= 400,
    // ce qui masque le vrai message d'erreur côté client.
    return Response.json({ ok: false, error: err.message });
  }
});
