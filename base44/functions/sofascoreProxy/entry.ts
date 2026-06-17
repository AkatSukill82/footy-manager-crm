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

// ── Matcher d'identité (partagé conceptuellement avec les autres proxies) ──────
// Évite de prendre aveuglément le 1er résultat : score chaque candidat sur
// nom + club + nationalité + année de naissance, et n'accepte qu'au-dessus d'un
// seuil de similarité de nom. Retourne null plutôt qu'un mauvais joueur.

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

interface Hint { name: string; club?: string; nationality?: string; birthYear?: number; }
interface Cand { id: number; name: string; team?: string; nationality?: string; birthYear?: number; }

const pickBest = (cands: Cand[], hint: Hint): { cand: Cand; confidence: number } | null => {
  let best: Cand | null = null, bestScore = -1, bestNameSim = 0;
  for (const c of cands) {
    const nameSim = overlap(c.name, hint.name);
    if (nameSim < 0.5) continue;                      // le nom DOIT correspondre
    let score = nameSim * 4;
    if (hint.club && c.team) score += overlap(c.team, hint.club) * 3;
    if (hint.nationality && c.nationality &&
        norm(c.nationality) === norm(hint.nationality)) score += 1;
    if (hint.birthYear && c.birthYear &&
        Math.abs(c.birthYear - hint.birthYear) <= 1) score += 2;
    if (score > bestScore) { bestScore = score; best = c; bestNameSim = nameSim; }
  }
  if (!best) return null;
  // Confiance : nom seul ~0.5 ; bonus club/nat/âge montent vers 1.
  const confidence = Math.min(1, bestNameSim * 0.6 + (bestScore - bestNameSim * 4) / 6 * 0.4 + 0.1);
  return { cand: best, confidence: Math.round(confidence * 100) / 100 };
};

// ── Recherche joueur ──────────────────────────────────────────────────────────

const searchPlayer = async (name: string, hint: Hint): Promise<{ id: number; name: string; confidence: number } | null> => {
  const json = await ssGet(`/search/all?q=${encodeURIComponent(name)}`);
  const entries = (json.results || []).filter((r: any) => r.type === "player");
  if (entries.length === 0) return null;

  const cands: Cand[] = entries.map((r: any) => ({
    id: r.entity?.id,
    name: r.entity?.name ?? "",
    team: r.entity?.team?.name,
    nationality: r.entity?.country?.name,
    birthYear: r.entity?.dateOfBirthTimestamp
      ? new Date(r.entity.dateOfBirthTimestamp * 1000).getUTCFullYear()
      : undefined,
  })).filter((c: Cand) => c.id != null);

  const best = pickBest(cands, hint);
  if (!best) return null;
  return { id: best.cand.id, name: best.cand.name, confidence: best.confidence };
};

// ── Stats saison en cours (agrégé toutes compétitions) ───────────────────────

const CURRENT_YEAR = 2025;

const getSeasonStats = async (playerId: number): Promise<Record<string, any>> => {
  const json = await ssGet(`/player/${playerId}/statistics`);
  const seasons: any[] = json.seasons || [];

  // Année de chaque entrée saison (une entrée par tournoi).
  const yearOf = (s: any): number | null => {
    if (typeof s.startYear === "number") return s.startYear;
    if (typeof s.year === "string") {
      const m = s.year.match(/(\d{2,4})/);
      if (m) { const y = parseInt(m[1]); return y < 100 ? 2000 + y : y; }
    }
    return null;
  };

  // Périmètre canonique = UNE seule saison (la courante si présente, sinon la
  // plus récente disponible), agrégée sur toutes les compétitions de CETTE
  // saison. On ne mélange JAMAIS plusieurs saisons (ancien bug slice(0,10)).
  let targetYear = CURRENT_YEAR;
  if (!seasons.some((s) => yearOf(s) === CURRENT_YEAR)) {
    const years = seasons.map(yearOf).filter((y): y is number => y != null);
    targetYear = years.length ? Math.max(...years) : CURRENT_YEAR;
  }
  const pool = seasons.filter((s) => yearOf(s) === targetYear);

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

  // Entier positif, sinon null
  const n = (key: string): number | null => {
    const v = sum[key];
    return (v != null && v > 0) ? Math.round(v) : null;
  };
  // Flottant 2 décimales positif, sinon null
  const f = (key: string): number | null => {
    const v = sum[key];
    return (v != null && v > 0) ? Math.round(v * 100) / 100 : null;
  };
  // Pourcentage calculé depuis deux totaux
  const pct = (a: string, b: string): number | null => {
    const x = sum[a], y = sum[b];
    if (x == null || !y) return null;
    const p = Math.round((x / y) * 100);
    return p > 0 && p <= 100 ? p : null;
  };
  // Premier total disponible parmi plusieurs noms de champs possibles
  const pick = (...keys: string[]): number | null => {
    for (const k of keys) if (sum[k] != null && sum[k] > 0) return Math.round(sum[k]);
    return null;
  };

  const tirs       = n("totalShots");
  const tirsCadres = n("shotsOnTarget");

  return {
    // ── Synthèse ──
    matchs_joues:     n("appearances"),
    titularisations:  null,
    minutes_jouees:   n("minutesPlayed"),
    note_moyenne:     avgRating,
    // ── Offensif ──
    buts:             n("goals"),
    passes_decisives: n("assists"),
    xg:               f("expectedGoals"),
    xa:               f("expectedAssists"),
    tirs:             tirs,
    tirs_cadres:      tirsCadres,
    tirs_cadres_pct:  (tirs && tirsCadres) ? Math.round((tirsCadres / tirs) * 100) : null,
    grandes_chances:         n("bigChancesCreated"),
    grandes_chances_manquees: n("bigChancesMissed"),
    penaltys_marques: pick("penaltyGoals", "penaltiesScored"),
    // ── Passes ──
    passes_reussies:    n("accuratePasses"),
    passes_reussies_pct: pct("accuratePasses", "totalPasses"),
    passes_cles:        n("keyPasses"),
    passes_longues_pct: pct("accurateLongBalls", "totalLongBalls"),
    centres:            pick("totalCross", "totalCrosses"),
    centres_reussis_pct: pct("accurateCross", "totalCross") ?? pct("accurateCrosses", "totalCrosses"),
    // ── Dribbles / possession ──
    dribbles_reussis: n("successfulDribbles"),
    dribbles_tentes:  pick("totalContests", "dribbleAttempts"),
    dribbles_pct:     pct("successfulDribbles", "totalContests"),
    touches_balle:    n("touches"),
    pertes_balle:     pick("possessionLost", "dispossessed"),
    duels_gagnes_pct:  pct("totalDuelsWon", "totalDuels") ?? pick("totalDuelsWonPercentage"),
    duels_aeriens_pct: pct("aerialDuelsWon", "aerialDuelsTotal") ?? pct("aerialDuelsWon", "totalAerialDuels") ?? pick("aerialDuelsWonPercentage"),
    // ── Défensif ──
    tacles:           n("tackles"),
    interceptions:    n("interceptions"),
    degagements:      pick("totalClearances", "clearances"),
    recuperations:    pick("ballRecovery", "recoveries"),
    // ── Discipline ──
    cartons_jaunes:   n("yellowCards"),
    cartons_rouges:   n("redCards"),
    fautes_commises:  n("fouls"),
    fautes_subies:    pick("wasFouled", "fouled"),
    hors_jeu:         n("offsides"),
    // ── Gardien ──
    arrets:           n("saves"),
    buts_encaisses:   n("goalsConceded"),
    clean_sheets:     n("cleanSheet"),
    source: "SofaScore",
    saison: `${targetYear}/${(targetYear + 1) % 100}`, // périmètre : 1 saison, toutes compétitions
    sofascore_id: String(playerId),
  };
};

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const { action, query, club, nationality, birthYear, sofascore_id } = await req.json();

    if (action === "searchAndGetStats") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const player = await searchPlayer(query.trim(), { name: query.trim(), club, nationality, birthYear });
      if (!player) return Response.json({ ok: false, error: "Joueur non trouvé sur SofaScore (aucun candidat fiable)." });
      const stats = await getSeasonStats(player.id);
      return Response.json({ ok: true, player_name: player.name, confidence: player.confidence, stats });
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
