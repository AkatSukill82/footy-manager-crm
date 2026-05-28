/**
 * Enrichit un joueur depuis Transfermarkt + SofaScore en PARALLÈLE.
 *
 * Phase 1 (parallel) : TM search + SS search            (~3s)
 * Phase 2 (parallel) : TM profile + TM valeur + SS stats (~3s)
 * Total visé : 4-6s au lieu de 8-16s en séquentiel.
 *
 * Param optionnel `source` : "transfermarkt" | "sofascore" | undefined (les deux)
 * → permet d'appeler les sources séparément depuis le mobile pour un affichage progressif.
 *
 * Usage :
 *   base44.functions.invoke("enrichPlayerFromAPI", { playerName: "Kylian Mbappé" })
 *   base44.functions.invoke("enrichPlayerFromAPI", { playerName: "Kylian Mbappé", source: "transfermarkt" })
 */

const TM_BASE = "https://transfermarkt-api.fly.dev";
const SS_BASE = "https://api.sofascore.com/api/v1";
const TIMEOUT  = 7000; // ms par requête

// ── Parseurs ──────────────────────────────────────────────────────────────────

function parseTMValue(str: string | null | undefined): number | null {
  if (!str) return null;
  const s = str.replace(/\s/g, "").replace(",", ".");
  const mio = s.match(/([\d.]+)Mio/); if (mio) return parseFloat(mio[1]);
  const tsd = s.match(/([\d.]+)Tsd/); if (tsd) return Math.round(parseFloat(tsd[1])) / 1000;
  return null;
}

function parseTMHeight(str: string | null | undefined): number | null {
  if (!str) return null;
  const s = str.replace(",", ".").replace(/\s/g, "");
  const m = s.match(/([\d.]+)m/);
  if (m) { const v = parseFloat(m[1]); return v < 3 ? Math.round(v * 100) : Math.round(v); }
  const cm = parseInt(s.replace(/\D/g, "")); return isNaN(cm) ? null : cm;
}

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

// ── Fetch helpers ─────────────────────────────────────────────────────────────

const tmGet = async (path: string) => {
  const res = await fetch(`${TM_BASE}${path}`, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`TM HTTP ${res.status}`);
  return res.json();
};

const ssGet = async (path: string) => {
  const res = await fetch(`${SS_BASE}${path}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://www.sofascore.com/",
      "Origin": "https://www.sofascore.com",
    },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`SS HTTP ${res.status}`);
  return res.json();
};

// safe wrapper : ne throw jamais, retourne null en cas d'erreur
const safe = async <T>(fn: () => Promise<T>, label: string, errors: string[]): Promise<T | null> => {
  try { return await fn(); }
  catch (e: any) { errors.push(`${label}: ${e.message}`); return null; }
};

// ── Extracteurs Transfermarkt ─────────────────────────────────────────────────

function extractTMSearch(data: any, out: Record<string, unknown>) {
  const first = data?.results?.[0];
  if (!first) return null;
  const tmId = String(first.id);
  if (first.name)             out.nom             = first.name;
  const posMain = first.position?.main ?? first.position;
  if (posMain)                out.poste           = TM_POS[posMain] || posMain;
  if (first.age)              out.age             = first.age;
  if (first.club?.name)       out.club_actuel     = first.club.name;
  const nat = Array.isArray(first.nationality) ? first.nationality[0] : first.nationality;
  if (nat)                    out.nationalite     = nat;
  const mv = parseTMValue(first.marketValue);
  if (mv !== null)            out.valeur_marchande = mv;
  out.transfermarkt_id = tmId;
  return tmId;
}

function extractTMProfile(p: any, out: Record<string, unknown>) {
  const dob = p.dateOfBirth?.date ?? p.dateOfBirth;
  if (dob)                         out.date_naissance  = String(dob).substring(0, 10);
  if (p.placeOfBirth?.city)        out.lieu_naissance  = p.placeOfBirth.city;
  const h = parseTMHeight(p.height);
  if (h)                           out.taille          = h;
  if (p.foot)                      out.pied_fort       = p.foot === "left" ? "Gauche" : p.foot === "both" ? "Les deux" : "Droit";
  const expiry = p.contractExpiry ?? p.contract?.expiry ?? p.contractUntil;
  if (expiry)                      out.contrat_fin     = String(expiry);
  const club = p.currentClub?.name ?? p.club?.name;
  if (club)                        out.club_actuel     = club;
  if (p.imageURL)                  out.photo_url       = p.imageURL;
  if (p.shirt ?? p.shirtNumber)    out.numero_maillot  = p.shirt ?? p.shirtNumber;
  if (p.agent?.name)               out.agent           = p.agent.name;
  const cit = Array.isArray(p.citizenship) ? p.citizenship[0] : p.citizenship;
  if (cit)                         out.nationalite     = cit;
  const mv = parseTMValue(p.marketValue);
  if (mv !== null)                 out.valeur_marchande = mv;
  const pos2 = p.position?.main ?? p.position;
  if (pos2)                        out.poste           = TM_POS[pos2] || pos2;
}

function extractTMMarketValue(data: any, out: Record<string, unknown>) {
  const history: any[] = data?.marketValueHistory ?? data?.history ?? [];
  let peak = 0;
  for (const e of history) {
    const v = parseTMValue(e.value ?? e.marketValue);
    if (v !== null && v > peak) peak = v;
  }
  if (peak > 0) out.valeur_marchande_peak = peak;
}

// ── Extracteur SofaScore ──────────────────────────────────────────────────────

function extractSSSearch(data: any, out: Record<string, unknown>): string | null {
  const hit = (data?.results ?? []).find((r: any) => r.type === "player");
  if (!hit?.entity) return null;
  const e = hit.entity;
  const ssId = String(e.id);
  out.sofascore_id = ssId;
  if (!out.photo_url)    out.photo_url   = `https://img.sofascore.com/api/v1/player/${ssId}/image`;
  if (!out.nationalite && e.country?.name) out.nationalite = e.country.name;
  if (!out.poste && e.position) out.poste = SS_POS[e.position] || e.position;
  if (!out.taille && e.height)  out.taille = e.height;
  if (!out.club_actuel && e.team?.name) out.club_actuel = e.team.name;
  return ssId;
}

function extractSSStats(data: any, out: Record<string, unknown>) {
  const seasons: any[] = data?.statistics ?? [];
  let best: any = null;
  for (const s of seasons) {
    const y = s.season?.year ?? s.tournamentSeasonId ?? 0;
    if (!best || y > (best.season?.year ?? best.tournamentSeasonId ?? 0)) best = s;
  }
  if (!best?.statistics) return;
  const st = best.statistics;
  const set = (k: string, v: unknown) => { if (v != null) out[k] = v; };

  set("note_moyenne",             st.rating != null ? Math.round(st.rating * 10) / 10 : null);
  set("buts",                     st.goals);
  set("passes_decisives",         st.assists);
  set("cartons_jaunes",           st.yellowCards);
  set("cartons_rouges",           st.redCards);
  set("minutes_jouees",           st.minutesPlayed);
  set("matchs_joues",             st.appearances);
  set("titularisations",          st.lineups ?? st.started);
  set("tirs",                     st.totalShots);
  set("tirs_cadres",              st.shotsOnTarget);
  set("passes_cles",              st.keyPasses);
  set("dribbles_reussis",         st.successfulDribbles);
  set("dribbles_tentes",          st.totalDribbleAttempts ?? st.attemptedDribbles);
  set("tacles",                   st.tackles);
  set("interceptions",            st.interceptions);
  set("grandes_chances",          st.bigChancesCreated);
  set("grandes_chances_manquees", st.bigChancesMissed);
  set("fautes_commises",          st.fouls);
  set("fautes_subies",            st.wasFouled);
  set("hors_jeu",                 st.offsides);
  set("penaltys_marques",         st.penaltyGoals);
  set("arrets",                   st.saves);
  set("clean_sheets",             st.cleanSheets);
  set("buts_encaisses",           st.goalsConceded);

  if (st.expectedGoals != null)   out.xg = Math.round(st.expectedGoals * 100) / 100;
  if (st.expectedAssists != null) out.xa = Math.round(st.expectedAssists * 100) / 100;
  if (st.expectedGoals != null && st.minutesPlayed)
    out.xg_par_90 = Math.round((st.expectedGoals / st.minutesPlayed) * 90 * 100) / 100;

  if (st.accuratePasses != null) {
    out.passes_reussies = st.accuratePasses;
    const total = st.accuratePasses + (st.inaccuratePasses ?? 0);
    if (total > 0) out.passes_reussies_pct = Math.round((st.accuratePasses / total) * 100);
  }
  if (st.groundDuelsWon != null && st.groundDuelsLost != null) {
    const t = st.groundDuelsWon + st.groundDuelsLost;
    if (t > 0) out.duels_gagnes_pct = Math.round((st.groundDuelsWon / t) * 100);
  }
  if (st.aerialDuelsWon != null && st.aerialDuelsLost != null) {
    const t = st.aerialDuelsWon + st.aerialDuelsLost;
    if (t > 0) out.duels_aeriens_pct = Math.round((st.aerialDuelsWon / t) * 100);
  }
  if (st.successfulDribbles != null) {
    const att = st.totalDribbleAttempts ?? st.attemptedDribbles;
    if (att > 0) out.dribbles_pct = Math.round((st.successfulDribbles / att) * 100);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Handler principal
// ════════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  try {
    const { playerName, source } = await req.json();
    if (!playerName) return Response.json({ error: "playerName requis" }, { status: 400 });

    const result: Record<string, unknown> = {};
    const sources: string[] = [];
    const errors: string[] = [];

    const useTM = !source || source === "transfermarkt";
    const useSS = !source || source === "sofascore";

    // ── PHASE 1 : recherches TM + SS en parallèle ────────────────────────────
    const [tmSearchData, ssSearchData] = await Promise.all([
      useTM ? safe(() => tmGet(`/players/search/${encodeURIComponent(playerName)}`), "TM search", errors) : Promise.resolve(null),
      useSS ? safe(() => ssGet(`/search/all?q=${encodeURIComponent(playerName)}`),  "SS search", errors) : Promise.resolve(null),
    ]);

    // Extraire les IDs
    let tmId: string | null = null;
    if (tmSearchData) { tmId = extractTMSearch(tmSearchData, result); if (tmId) sources.push("Transfermarkt"); }

    let ssId: string | null = null;
    if (ssSearchData) { ssId = extractSSSearch(ssSearchData, result); if (ssId) sources.push("SofaScore"); }

    // ── PHASE 2 : détails TM (profile + valeur) + stats SS en parallèle ──────
    await Promise.all([
      // TM profile
      tmId ? safe(async () => {
        const p = await tmGet(`/players/${tmId}/profile`);
        extractTMProfile(p, result);
      }, "TM profile", errors) : Promise.resolve(),

      // TM market value peak
      tmId ? safe(async () => {
        const mv = await tmGet(`/players/${tmId}/market_value`);
        extractTMMarketValue(mv, result);
      }, "TM market_value", errors) : Promise.resolve(),

      // SofaScore stats
      ssId ? safe(async () => {
        const stats = await ssGet(`/player/${ssId}/statistics/season`);
        extractSSStats(stats, result);
      }, "SS stats", errors) : Promise.resolve(),
    ]);

    const fieldsFound = Object.keys(result).filter(k => result[k] != null && result[k] !== "").length;
    return Response.json({
      success: true,
      fieldsFound,
      sources,
      data: result,
      ...(errors.length ? { errors } : {}),
    });

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
