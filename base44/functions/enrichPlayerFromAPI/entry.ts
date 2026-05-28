/**
 * Enrichit un joueur depuis 3 sources :
 *
 *  1. Transfermarkt  → infos personnelles (profil, valeur marchande, contrat, agent, photo)
 *  2. SofaScore      → stats de perf primaires (note, xG/xA, buts, passes, duels, dribbles…)
 *  3. FotMob         → stats de perf complémentaires (comble les trous de SofaScore)
 *
 * Flux parallèle :
 *   Phase 1 : [TM search] + [SS search] + [FM search]            (en même temps)
 *   Phase 2 : [TM profile + TM valeur] + [SS stats] + [FM stats] (en même temps)
 *   Cible : ~3-5s total
 *
 * Param `source` optionnel :
 *   "transfermarkt" → profil/valeur uniquement
 *   "stats"         → SofaScore + FotMob uniquement
 *   undefined       → tout
 */

const TM_BASE = "https://transfermarkt-api.fly.dev";
const SS_BASE = "https://api.sofascore.com/api/v1";
const FM_BASE = "https://www.fotmob.com/api";
const TIMEOUT  = 7000;

// ── Parseurs ──────────────────────────────────────────────────────────────────

function parseTMValue(s: string | null | undefined): number | null {
  if (!s) return null;
  const c = s.replace(/\s/g, "").replace(",", ".");
  const mio = c.match(/([\d.]+)Mio/); if (mio) return parseFloat(mio[1]);
  const tsd = c.match(/([\d.]+)Tsd/); if (tsd) return Math.round(parseFloat(tsd[1])) / 1000;
  return null;
}

function parseTMHeight(s: string | null | undefined): number | null {
  if (!s) return null;
  const c = s.replace(",", ".").replace(/\s/g, "");
  const m = c.match(/([\d.]+)m/);
  if (m) { const v = parseFloat(m[1]); return v < 3 ? Math.round(v * 100) : Math.round(v); }
  const cm = parseInt(c.replace(/\D/g, "")); return isNaN(cm) ? null : cm;
}

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}

// ── Tables de correspondance postes ───────────────────────────────────────────

const TM_POS: Record<string, string> = {
  "Goalkeeper": "Gardien",
  "Centre-Back": "Défenseur central", "Centre-back": "Défenseur central",
  "Left-Back": "Latéral gauche",  "Left Back": "Latéral gauche",
  "Right-Back": "Latéral droit",  "Right Back": "Latéral droit",
  "Defensive Midfield": "Milieu défensif",
  "Central Midfield": "Milieu central",
  "Attacking Midfield": "Milieu offensif",
  "Left Winger": "Ailier gauche",  "Left Wing": "Ailier gauche",
  "Right Winger": "Ailier droit",  "Right Wing": "Ailier droit",
  "Centre-Forward": "Attaquant", "Centre Forward": "Attaquant",
  "Second Striker": "Attaquant",  "Striker": "Attaquant",
};

const SS_POS: Record<string, string> = {
  G: "Gardien", D: "Défenseur central", M: "Milieu central", F: "Attaquant",
};

const FM_POS: Record<string, string> = {
  "Goalkeeper": "Gardien",
  "Right Back": "Latéral droit",  "Left Back": "Latéral gauche",
  "Center Back": "Défenseur central", "Centre Back": "Défenseur central",
  "Defensive Midfielder": "Milieu défensif",
  "Central Midfielder": "Milieu central",
  "Attacking Midfielder": "Milieu offensif",
  "Right Winger": "Ailier droit",  "Left Winger": "Ailier gauche",
  "Striker": "Attaquant", "Center Forward": "Attaquant",
  "Forward": "Attaquant",
};

// ── Fetch helpers ─────────────────────────────────────────────────────────────

const tmGet = (path: string) =>
  fetch(`${TM_BASE}${path}`, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    signal: AbortSignal.timeout(TIMEOUT),
  }).then(r => { if (!r.ok) throw new Error(`TM ${r.status}`); return r.json(); });

const ssGet = (path: string) =>
  fetch(`${SS_BASE}${path}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://www.sofascore.com/",
      "Origin": "https://www.sofascore.com",
    },
    signal: AbortSignal.timeout(TIMEOUT),
  }).then(r => { if (!r.ok) throw new Error(`SS ${r.status}`); return r.json(); });

const fmGet = (path: string) =>
  fetch(`${FM_BASE}${path}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://www.fotmob.com/",
      "x-mas": "eyJib2R5Ijp7InVybCI6Imh0dHBzOi8vd3d3LmZvdG1vYi5jb20vYXBpL3NlYXJjaD90ZXJtPW1iYXBwZSJ9fQ==",
    },
    signal: AbortSignal.timeout(TIMEOUT),
  }).then(r => { if (!r.ok) throw new Error(`FM ${r.status}`); return r.json(); });

const safe = async <T>(fn: () => Promise<T>, label: string, errs: string[]): Promise<T | null> => {
  try { return await fn(); } catch (e: any) { errs.push(`${label}: ${e.message}`); return null; }
};

// ── Extracteurs Transfermarkt ─────────────────────────────────────────────────

function tmExtractSearch(data: any, out: Record<string, unknown>): string | null {
  const first = data?.results?.[0];
  if (!first) return null;
  const id = String(first.id);
  out.transfermarkt_id = id;
  if (first.name)       out.nom             = first.name;
  const pos = first.position?.main ?? first.position;
  if (pos)              out.poste           = TM_POS[pos] || pos;
  if (first.age)        out.age             = first.age;
  if (first.club?.name) out.club_actuel     = first.club.name;
  const nat = Array.isArray(first.nationality) ? first.nationality[0] : first.nationality;
  if (nat)              out.nationalite     = nat;
  const mv = parseTMValue(first.marketValue);
  if (mv != null)       out.valeur_marchande = mv;
  return id;
}

function tmExtractProfile(p: any, out: Record<string, unknown>) {
  const dob = p.dateOfBirth?.date ?? p.dateOfBirth;
  if (dob)                          out.date_naissance  = String(dob).substring(0, 10);
  if (p.placeOfBirth?.city)         out.lieu_naissance  = p.placeOfBirth.city;
  const h = parseTMHeight(p.height);
  if (h)                            out.taille          = h;
  if (p.foot)                       out.pied_fort       = p.foot === "left" ? "Gauche" : p.foot === "both" ? "Les deux" : "Droit";
  const expiry = p.contractExpiry ?? p.contract?.expiry ?? p.contractUntil;
  if (expiry)                       out.contrat_fin     = String(expiry);
  const club = p.currentClub?.name ?? p.club?.name;
  if (club)                         out.club_actuel     = club;
  if (p.imageURL)                   out.photo_url       = p.imageURL;
  if (p.shirt ?? p.shirtNumber)     out.numero_maillot  = p.shirt ?? p.shirtNumber;
  if (p.agent?.name)                out.agent           = p.agent.name;
  const cit = Array.isArray(p.citizenship) ? p.citizenship[0] : p.citizenship;
  if (cit)                          out.nationalite     = cit;
  const mv = parseTMValue(p.marketValue);
  if (mv != null)                   out.valeur_marchande = mv;
  const pos = p.position?.main ?? p.position;
  if (pos)                          out.poste           = TM_POS[pos] || pos;
}

function tmExtractMarketValue(data: any, out: Record<string, unknown>) {
  const hist: any[] = data?.marketValueHistory ?? data?.history ?? [];
  let peak = 0;
  for (const e of hist) {
    const v = parseTMValue(e.value ?? e.marketValue);
    if (v != null && v > peak) peak = v;
  }
  if (peak > 0) out.valeur_marchande_peak = peak;
}

// ── Extracteur SofaScore (source primaire des stats) ─────────────────────────

function ssExtractSearch(data: any, out: Record<string, unknown>): string | null {
  const hit = (data?.results ?? []).find((r: any) => r.type === "player");
  if (!hit?.entity) return null;
  const e = hit.entity;
  const ssId = String(e.id);
  out.sofascore_id = ssId;
  if (!out.photo_url)   out.photo_url   = `https://img.sofascore.com/api/v1/player/${ssId}/image`;
  if (!out.nationalite && e.country?.name) out.nationalite = e.country.name;
  if (!out.poste && e.position) out.poste = SS_POS[e.position] || e.position;
  if (!out.taille && e.height)  out.taille = e.height;
  if (!out.club_actuel && e.team?.name) out.club_actuel = e.team.name;
  return ssId;
}

function ssExtractStats(data: any, out: Record<string, unknown>) {
  const seasons: any[] = data?.statistics ?? [];
  let best: any = null;
  for (const s of seasons) {
    const y = s.season?.year ?? s.tournamentSeasonId ?? 0;
    if (!best || y > (best.season?.year ?? best.tournamentSeasonId ?? 0)) best = s;
  }
  if (!best?.statistics) return;
  const st = best.statistics;
  const w = (k: string, v: unknown) => { if (v != null) out[k] = v; };

  w("note_moyenne",             st.rating != null ? Math.round(st.rating * 10) / 10 : null);
  w("buts",                     st.goals);
  w("passes_decisives",         st.assists);
  w("cartons_jaunes",           st.yellowCards);
  w("cartons_rouges",           st.redCards);
  w("minutes_jouees",           st.minutesPlayed);
  w("matchs_joues",             st.appearances);
  w("titularisations",          st.lineups ?? st.started);
  w("tirs",                     st.totalShots);
  w("tirs_cadres",              st.shotsOnTarget);
  w("passes_cles",              st.keyPasses);
  w("dribbles_reussis",         st.successfulDribbles);
  w("dribbles_tentes",          st.totalDribbleAttempts ?? st.attemptedDribbles);
  w("tacles",                   st.tackles);
  w("interceptions",            st.interceptions);
  w("grandes_chances",          st.bigChancesCreated);
  w("grandes_chances_manquees", st.bigChancesMissed);
  w("fautes_commises",          st.fouls);
  w("fautes_subies",            st.wasFouled);
  w("hors_jeu",                 st.offsides);
  w("penaltys_marques",         st.penaltyGoals);
  w("arrets",                   st.saves);
  w("clean_sheets",             st.cleanSheets);
  w("buts_encaisses",           st.goalsConceded);

  if (st.expectedGoals != null)   out.xg = Math.round(st.expectedGoals * 100) / 100;
  if (st.expectedAssists != null) out.xa = Math.round(st.expectedAssists * 100) / 100;
  if (st.expectedGoals != null && st.minutesPlayed)
    out.xg_par_90 = Math.round(st.expectedGoals / st.minutesPlayed * 90 * 100) / 100;
  if (st.accuratePasses != null) {
    out.passes_reussies = st.accuratePasses;
    const t = st.accuratePasses + (st.inaccuratePasses ?? 0);
    if (t > 0) out.passes_reussies_pct = Math.round(st.accuratePasses / t * 100);
  }
  if (st.groundDuelsWon != null && st.groundDuelsLost != null) {
    const t = st.groundDuelsWon + st.groundDuelsLost;
    if (t > 0) out.duels_gagnes_pct = Math.round(st.groundDuelsWon / t * 100);
  }
  if (st.aerialDuelsWon != null && st.aerialDuelsLost != null) {
    const t = st.aerialDuelsWon + st.aerialDuelsLost;
    if (t > 0) out.duels_aeriens_pct = Math.round(st.aerialDuelsWon / t * 100);
  }
  if (st.successfulDribbles != null) {
    const a = st.totalDribbleAttempts ?? st.attemptedDribbles;
    if (a > 0) out.dribbles_pct = Math.round(st.successfulDribbles / a * 100);
  }
}

// ── Extracteur FotMob (comble les trous de SofaScore) ────────────────────────

function fmExtractSearch(data: any): string | null {
  // La réponse de /search peut avoir plusieurs structures selon la version
  const players: any[] =
    data?.squad ??
    data?.playerQuery?.searchResults ??
    (data?.results ?? []).filter((r: any) => r.type === "player") ?? [];
  const hit = players[0];
  if (!hit) return null;
  return String(hit.id ?? hit.playerId);
}

function fmExtractPlayerData(data: any, out: Record<string, unknown>) {
  // Infos perso (complément TM si absent)
  if (!out.photo_url && data?.imageUrl)    out.photo_url   = data.imageUrl;
  if (!out.taille && data?.height)         out.taille      = toNum(String(data.height).replace(/\D/g, ""));
  if (!out.poids && data?.weight)          out.poids       = toNum(String(data.weight).replace(/\D/g, ""));
  if (!out.club_actuel && data?.primaryTeam?.teamName) out.club_actuel = data.primaryTeam.teamName;
  if (!out.poste && data?.position)        out.poste       = FM_POS[data.position] || data.position;
  if (!out.numero_maillot && data?.shirtNumber) out.numero_maillot = data.shirtNumber;

  // Stats — construire une map {key → value} depuis les items FotMob
  const items: any[] =
    data?.mainLeague?.statSummary?.items ??
    data?.currentTeamStats?.items ??
    data?.statSummary?.items ?? [];

  const fm: Record<string, number | null> = {};
  for (const item of items) {
    const key = (item.key ?? item.title ?? "").toLowerCase()
      .replace(/ /g, "_").replace(/-/g, "_");
    const val = toNum(item.value);
    if (key && val != null) fm[key] = val;
  }

  // Helper : écrit dans `out` seulement si SofaScore n'a pas déjà rempli le champ
  const fill = (outKey: string, ...fmKeys: string[]) => {
    if (out[outKey] != null) return;
    for (const k of fmKeys) { if (fm[k] != null) { out[outKey] = fm[k]; return; } }
  };

  fill("buts",             "goals", "goal", "g");
  fill("passes_decisives", "assists", "assist", "a");
  fill("cartons_jaunes",   "yellow_cards", "yellowcards", "yellow");
  fill("cartons_rouges",   "red_cards", "redcards", "red");
  fill("minutes_jouees",   "minutes_played", "minutesplayed", "mins");
  fill("matchs_joues",     "appearances", "matches_played", "games");
  fill("titularisations",  "starts", "started");
  fill("tirs",             "shots", "total_shots", "shots_total");
  fill("tirs_cadres",      "shots_on_target", "on_target");
  fill("passes_cles",      "key_passes", "keypasses", "chances_created");
  fill("dribbles_reussis", "dribbles", "successful_dribbles", "dribbles_won");
  fill("tacles",           "tackles", "tackles_won");
  fill("interceptions",    "interceptions");
  fill("fautes_commises",  "fouls", "fouls_committed");
  fill("arrets",           "saves");
  fill("clean_sheets",     "clean_sheets", "cleansheets");
  fill("buts_encaisses",   "goals_conceded", "conceded");
  fill("xg",               "xg", "expected_goals");
  fill("xa",               "xa", "expected_assists");
  fill("hors_jeu",         "offsides");

  // Note FotMob (uniquement si SofaScore n'a pas donné de note)
  fill("note_moyenne",     "rating", "fotmob_rating", "average_rating");
}

// ════════════════════════════════════════════════════════════════════════════
// Handler principal
// ════════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  try {
    const { playerName, source } = await req.json();
    if (!playerName) return Response.json({ error: "playerName requis" }, { status: 400 });

    const out: Record<string, unknown> = {};
    const sources: string[] = [];
    const errors: string[] = [];

    const useTM = !source || source === "transfermarkt";
    const useSS = !source || source === "stats";
    const useFM = !source || source === "stats";

    // ── PHASE 1 : recherches en parallèle ────────────────────────────────────
    const enc = encodeURIComponent(playerName);
    const [tmSearch, ssSearch, fmSearch] = await Promise.all([
      useTM ? safe(() => tmGet(`/players/search/${enc}`),         "TM search", errors) : Promise.resolve(null),
      useSS ? safe(() => ssGet(`/search/all?q=${enc}`),           "SS search", errors) : Promise.resolve(null),
      useFM ? safe(() => fmGet(`/search?term=${enc}`),            "FM search", errors) : Promise.resolve(null),
    ]);

    // Extraire les IDs
    let tmId: string | null = null;
    let ssId: string | null = null;
    let fmId: string | null = null;

    if (tmSearch) { tmId = tmExtractSearch(tmSearch, out); if (tmId) sources.push("Transfermarkt"); }
    if (ssSearch) { ssId = ssExtractSearch(ssSearch, out); if (ssId) sources.push("SofaScore"); }
    if (fmSearch) { fmId = fmExtractSearch(fmSearch);      if (fmId) sources.push("FotMob"); }

    // ── PHASE 2 : données détaillées en parallèle ─────────────────────────────
    await Promise.all([
      // TM : profil complet
      tmId ? safe(async () => {
        const p = await tmGet(`/players/${tmId}/profile`);
        tmExtractProfile(p, out);
      }, "TM profile", errors) : Promise.resolve(),

      // TM : valeur marchande peak
      tmId ? safe(async () => {
        const mv = await tmGet(`/players/${tmId}/market_value`);
        tmExtractMarketValue(mv, out);
      }, "TM market_value", errors) : Promise.resolve(),

      // SofaScore : stats saison (source primaire)
      ssId ? safe(async () => {
        const st = await ssGet(`/player/${ssId}/statistics/season`);
        ssExtractStats(st, out);
      }, "SS stats", errors) : Promise.resolve(),

      // FotMob : stats saison (comble les trous)
      fmId ? safe(async () => {
        const d = await fmGet(`/playerData?id=${fmId}`);
        fmExtractPlayerData(d, out);
      }, "FM playerData", errors) : Promise.resolve(),
    ]);

    const fieldsFound = Object.keys(out).filter(k => out[k] != null && out[k] !== "").length;
    return Response.json({
      success: true,
      fieldsFound,
      sources,
      data: out,
      ...(errors.length ? { errors } : {}),
    });

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
