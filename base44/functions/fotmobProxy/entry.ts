/**
 * Proxy FotMob — recherche joueurs + stats saison.
 *
 * IMPORTANT — structure réelle de l'endpoint suggest :
 *   FotMob retourne un ARRAY, pas un objet.
 *   Exemple : [{title:{key:"all"}, suggestions:[{type:"player", id:"30893", name:"Ronaldo", teamName:"Al Nassr", teamId:101918}]}]
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

// ── Matcher d'identité : score nom + club, n'accepte qu'au-dessus d'un seuil ───

const STOP = new Set(["fc", "cf", "sc", "ac", "afc", "cd", "club", "de", "the", "us", "ss", "as", "ud", "rc", "sv", "if"]);
const norm = (s: string): string =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const toks = (s: string): Set<string> =>
  new Set(norm(s).split(" ").filter((t) => t.length > 1 && !STOP.has(t)));
const overlap = (a: string, b: string): number => {
  const A = toks(a), B = toks(b);
  if (!A.size || !B.size) return 0;
  let n = 0; for (const t of A) if (B.has(t)) n++;
  return n / Math.min(A.size, B.size);
};

interface Hint { name: string; club?: string; }

// ── Recherche joueur interne ───────────────────────────────────────────────────

const searchPlayer = async (name: string, hint: Hint): Promise<{ id: number; name: string; confidence: number } | null> => {
  const json    = await fmGet(`/search/suggest?hits=20&lang=en&term=${encodeURIComponent(name)}`);
  const all     = parseSuggest(json);
  const players = all.filter((r: any) => r.type === "player" && !r.isCoach);
  if (players.length === 0) return null;

  let best: any = null, bestScore = -1, bestNameSim = 0;
  for (const p of players) {
    const nameSim = overlap(p.name ?? "", hint.name);
    if (nameSim < 0.5) continue;                        // le nom DOIT correspondre
    let score = nameSim * 4;
    if (hint.club && p.teamName) score += overlap(p.teamName, hint.club) * 3;
    if (score > bestScore) { bestScore = score; best = p; bestNameSim = nameSim; }
  }
  if (!best) return null;
  const confidence = Math.min(1, bestNameSim * 0.6 + (bestScore - bestNameSim * 4) / 3 * 0.4 + 0.1);
  return { id: parseInt(best.id), name: best.name, confidence: Math.round(confidence * 100) / 100 };
};

// ── Stats joueur ──────────────────────────────────────────────────────────────

// Titres FotMob (EN) → champs entité Player. Plusieurs libellés possibles par
// champ selon les versions de l'API ; on prend le premier présent.
const STAT_MAP: Record<string, string> = {
  // Synthèse
  "Matches":              "matchs_joues",
  "Appearances":          "matchs_joues",
  "Started":              "titularisations",
  "Minutes played":       "minutes_jouees",
  "Rating":               "note_fotmob",
  "FotMob rating":        "note_fotmob",
  // Offensif
  "Goals":                "buts",
  "Assists":              "passes_decisives",
  "xG":                   "xg",
  "Expected goals (xG)":  "xg",
  "xA":                   "xa",
  "Expected assists (xA)":"xa",
  "Shots":                "tirs",
  "Shots on target":      "tirs_cadres",
  "Big chances missed":   "grandes_chances_manquees",
  "Penalties scored":     "penaltys_marques",
  // Passes / création
  "Key passes":           "passes_cles",
  "Chances created":      "passes_cles",
  "Big chances created":  "grandes_chances",
  "Accurate passes":      "passes_reussies",
  "Successful crosses":   "centres",
  // Dribbles / possession
  "Dribbles":             "dribbles_reussis",
  "Successful dribbles":  "dribbles_reussis",
  "Touches":              "touches_balle",
  "Dispossessed":         "pertes_balle",
  // Défensif
  "Tackles":              "tacles",
  "Tackles won":          "tacles",
  "Interceptions":        "interceptions",
  "Recoveries":           "recuperations",
  "Clearances":           "degagements",
  "Blocks":               "tirs_bloques",
  // Discipline
  "Yellow cards":         "cartons_jaunes",
  "Red cards":            "cartons_rouges",
  "Fouls":                "fautes_commises",
  "Was fouled":           "fautes_subies",
  "Offsides":             "hors_jeu",
  // Gardien
  "Saves":                "arrets",
  "Goals conceded":       "buts_encaisses",
  "Clean sheets":         "clean_sheets",
  // ── Stats avancées (granularité fiche FotMob) ──
  "Non-penalty xG":                       "xg_hors_penalty",
  "Non-penalty expected goals (xG)":      "xg_hors_penalty",
  "Expected goals (xG) excluding penalties": "xg_hors_penalty",
  "xGOT":                                 "xgot",
  "Expected goals on target":             "xgot",
  "Expected goals on target (xGOT)":      "xgot",
  "Accurate long balls":                  "passes_longues",
  "Successful long balls":                "passes_longues",
  "Touches in opposition box":            "touches_surface_adverse",
  "Touches in opp. box":                  "touches_surface_adverse",
  "Penalty area touches":                 "touches_surface_adverse",
  "Duels won":                            "duels_gagnes",
  "Ground duels won":                     "duels_gagnes",
  "Defensive actions":                    "actions_defensives",
  "Dribbled past":                        "dribbles_subis",
  "Was dribbled past":                    "dribbles_subis",
  "Dribbles attempted":                   "dribbles_tentes",
  "Possession lost":                      "pertes_balle",
  "Goals conceded while on pitch":        "buts_encaisses_terrain",
  "Goals conceded on pitch":              "buts_encaisses_terrain",
  "Goals conceded (team)":                "buts_encaisses_terrain",
  "Expected goals conceded":              "xg_concede_terrain",
  "Expected goals conceded (xGC)":        "xg_concede_terrain",
  "xG conceded while on pitch":           "xg_concede_terrain",
  "xGC":                                  "xg_concede_terrain",
};

// Titres dont la valeur FotMob contient un pourcentage à extraire (ex: "8 (80.5%)").
// Le champ "compte" reste géré par STAT_MAP ci-dessus.
const STAT_PCT_MAP: Record<string, string> = {
  "Accurate passes":       "passes_reussies_pct",
  "Pass accuracy":         "passes_reussies_pct",
  "Accurate long balls":   "passes_longues_pct",
  "Successful long balls": "passes_longues_pct",
  "Successful crosses":    "centres_reussis_pct",
  "Accurate crosses":      "centres_reussis_pct",
  "Shots on target":       "tirs_cadres_pct",
  "Duels won":             "duels_gagnes_pct",
  "Ground duels won":      "duels_gagnes_pct",
  "Successful dribbles":   "dribbles_pct",
  "Dribbles":              "dribbles_pct",
  "Tackles won":           "tacles_reussis_pct",
};

// Champs cumulables sur plusieurs compétitions (compteurs). Les % et notes ne se
// somment pas : ils ne sont pris que sur la ligue principale.
const NO_SUM = new Set([
  "note_fotmob", "note_moyenne",
  "tirs_cadres_pct", "passes_reussies_pct", "passes_longues_pct",
  "centres_reussis_pct", "duels_gagnes_pct", "dribbles_pct", "tacles_reussis_pct",
]);

// Extrait la valeur numérique principale + un éventuel pourcentage.
// FotMob renvoie selon la stat : un nombre, une string "8 (80.5%)" ou "80.5%",
// ou un objet { value, total, percent }.
const parseStatValue = (raw: any): { num: number | null; pct: number | null } => {
  if (raw == null) return { num: null, pct: null };
  if (typeof raw === "number") return { num: Number.isFinite(raw) ? raw : null, pct: null };
  if (typeof raw === "object") {
    const inner = parseStatValue(raw.value ?? raw.statValue ?? raw.total ?? raw.num ?? null);
    const pctRaw = raw.percent ?? raw.percentage ?? null;
    const pct = typeof pctRaw === "number" ? pctRaw : parseStatValue(pctRaw).num;
    return { num: inner.num, pct: pct ?? inner.pct };
  }
  const s = String(raw);
  const pctM = s.match(/([\d.]+)\s*%/);
  const pct = pctM ? parseFloat(pctM[1]) : null;
  // Premier nombre en dehors d'une parenthèse de pourcentage
  const numM = s.replace(/\([^)]*\)/g, " ").match(/-?\d+(?:\.\d+)?/);
  const num = numM ? parseFloat(numM[0]) : null;
  return { num: Number.isFinite(num as number) ? num : null, pct };
};

// Applique une stat (compte + %) dans l'accumulateur.
// sum=true : autres compétitions, on additionne les compteurs uniquement.
const applyStat = (stats: Record<string, any>, title: string, raw: any, sum: boolean) => {
  const field    = STAT_MAP[title];
  const pctField = STAT_PCT_MAP[title];
  if (!field && !pctField) return;
  const { num, pct } = parseStatValue(raw);
  if (field && num != null) {
    if (sum) { if (!NO_SUM.has(field)) stats[field] = (stats[field] ?? 0) + num; }
    else stats[field] = num;
  }
  // Pourcentages : ligue principale uniquement (la somme n'a pas de sens).
  if (pctField && pct != null && !sum && stats[pctField] == null) stats[pctField] = pct;
};

// Position FotMob (label EN) → poste entité Player (FR)
const POS_MAP: Record<string, string> = {
  "Goalkeeper": "Gardien",
  "Centre Back": "Défenseur central", "Center Back": "Défenseur central",
  "Right Back": "Latéral droit", "Left Back": "Latéral gauche",
  "Right Wing Back": "Latéral droit", "Left Wing Back": "Latéral gauche",
  "Defensive Midfield": "Milieu défensif", "Defensive Midfielder": "Milieu défensif",
  "Central Midfield": "Milieu central", "Central Midfielder": "Milieu central",
  "Midfielder": "Milieu central",
  "Attacking Midfield": "Milieu offensif", "Attacking Midfielder": "Milieu offensif",
  "Right Winger": "Ailier droit", "Right Wing": "Ailier droit",
  "Left Winger": "Ailier gauche", "Left Wing": "Ailier gauche",
  "Striker": "Attaquant", "Centre Forward": "Attaquant", "Center Forward": "Attaquant",
  "Forward": "Attaquant", "Attacker": "Attaquant",
};

const mapFotmobPos = (label: string | null | undefined): string | null => {
  if (!label) return null;
  return POS_MAP[label] ?? null;
};

const getPlayerStats = async (playerId: number): Promise<Record<string, any>> => {
  const json  = await fmGet(`/playerData?id=${playerId}`);
  const stats: Record<string, any> = {};

  // Ligue principale : valeurs de référence (compteurs + pourcentages).
  for (const item of (json.mainLeague?.stats ?? [])) {
    applyStat(stats, item.title, item.value, false);
  }

  // Autres compétitions : on additionne uniquement les compteurs (cf. NO_SUM).
  for (const league of (json.otherLeagues ?? [])) {
    for (const item of (league.stats ?? [])) {
      applyStat(stats, item.title, item.value, true);
    }
  }

  // Poste depuis playerData (fiable depuis le cloud, sert de filet pour le champ requis)
  const posLabel = json?.positionDescription?.primaryPosition?.label
                ?? json?.origin?.positionDesc?.primaryPosition?.label
                ?? null;
  const poste = mapFotmobPos(posLabel);
  if (poste) stats.poste = poste;

  // Infos perso basiques disponibles dans playerData (fallback si TM/BeSoccer bloqués)
  if (json?.name) stats.nom = json.name;
  if (json?.birthDate?.utcTime) {
    stats.date_naissance = String(json.birthDate.utcTime).split("T")[0];
  }
  if (json?.primaryTeam?.teamName) stats.club_actuel = json.primaryTeam.teamName;

  stats.source    = "FotMob";
  // Périmètre : saison en cours, ligue principale + autres compétitions (cf. boucles ci-dessus).
  if (json?.mainLeague?.season) stats.saison = String(json.mainLeague.season);
  stats.fotmob_id = String(playerId);
  return stats;
};

// Matchs récents + performance du joueur (depuis playerData.recentMatches)
const mapRecentMatches = (json: any): any[] => {
  const list: any[] = json?.recentMatches ?? json?.lastMatches ?? [];
  return list.slice(0, 8).map((m: any) => {
    const r = m.ratingProps?.rating ?? m.rating ?? null;
    return {
      date:        m.matchDate ? String(m.matchDate).split("T")[0] : (m.date ?? null),
      competition: m.leagueName ?? m.tournamentName ?? null,
      adversaire:  m.opponentTeamName ?? m.opponentName ?? null,
      domicile:    m.home ?? m.isHome ?? null,
      score:       (m.homeScore != null && m.awayScore != null) ? `${m.homeScore}-${m.awayScore}` : null,
      minutes:     m.minutesPlayed ?? null,
      buts:        m.goals ?? null,
      passes:      m.assists ?? null,
      note:        r != null ? Number(r) : null,
      a_joue:      (m.minutesPlayed ?? 0) > 0,
    };
  });
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
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { action, query, club, fotmob_id } = await req.json();
    const hint: Hint = { name: (query ?? "").trim(), club };

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
      const player = await searchPlayer(query.trim(), hint);
      if (!player) return Response.json({ ok: false, error: "Joueur non trouvé sur FotMob (aucun candidat fiable)." });
      const stats = await getPlayerStats(player.id);
      return Response.json({ ok: true, player_name: player.name, confidence: player.confidence, stats });
    }

    // ── Stats depuis ID connu ────────────────────────────────────────────────
    if (action === "getStats") {
      if (!fotmob_id) return Response.json({ ok: false, error: "fotmob_id requis" });
      const stats = await getPlayerStats(parseInt(fotmob_id));
      return Response.json({ ok: true, stats });
    }

    // ── Matchs récents + performance (recherche par nom) ─────────────────────
    if (action === "searchAndGetMatches") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const player = await searchPlayer(query.trim(), hint);
      if (!player) return Response.json({ ok: false, error: "Joueur non trouvé sur FotMob (aucun candidat fiable)." });
      const json    = await fmGet(`/playerData?id=${player.id}`);
      const matches = mapRecentMatches(json);
      return Response.json({ ok: true, player_name: player.name, fotmob_id: String(player.id), matches });
    }

    // ── Matchs récents depuis ID connu ───────────────────────────────────────
    if (action === "getMatches") {
      if (!fotmob_id) return Response.json({ ok: false, error: "fotmob_id requis" });
      const json    = await fmGet(`/playerData?id=${parseInt(fotmob_id)}`);
      const matches = mapRecentMatches(json);
      return Response.json({ ok: true, matches });
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
