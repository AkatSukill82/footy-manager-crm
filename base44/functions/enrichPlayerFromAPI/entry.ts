/**
 * Enrichit un joueur depuis deux sources, dans l'ordre :
 *  1. Transfermarkt (transfermarkt-api.fly.dev)
 *     → valeur marchande, club, contrat, taille, pied, agent, photo, nationalité
 *  2. SofaScore (API non-officielle)
 *     → buts, passes, cartons, minutes, note, xG/xA, dribbles, tacles, duels…
 *
 * Usage : base44.functions.invoke("enrichPlayerFromAPI", { playerName: "Kylian Mbappé" })
 */

const TM_BASE = "https://transfermarkt-api.fly.dev";
const SS_BASE = "https://api.sofascore.com/api/v1";

// "180,00 Mio. €" → 180.0  |  "800 Tsd. €" → 0.8
function parseTMValue(str: string | null | undefined): number | null {
  if (!str) return null;
  const s = str.replace(/\s/g, "").replace(",", ".");
  const mio = s.match(/([\d.]+)Mio/);
  if (mio) return parseFloat(mio[1]);
  const tsd = s.match(/([\d.]+)Tsd/);
  if (tsd) return Math.round(parseFloat(tsd[1])) / 1000;
  const raw = parseFloat(s.replace(/[^\d.]/g, ""));
  return isNaN(raw) ? null : raw;
}

// "1,78 m" ou "178 cm" → 178
function parseTMHeight(str: string | null | undefined): number | null {
  if (!str) return null;
  const s = str.replace(",", ".").replace(/\s/g, "");
  const m = s.match(/([\d.]+)m/);
  if (m) {
    const v = parseFloat(m[1]);
    return v < 3 ? Math.round(v * 100) : Math.round(v);
  }
  const cm = parseInt(s.replace(/\D/g, ""));
  return isNaN(cm) ? null : cm;
}

const TM_POS: Record<string, string> = {
  "Goalkeeper":       "Gardien",
  "Centre-Back":      "Défenseur central",
  "Centre-back":      "Défenseur central",
  "Left-Back":        "Latéral gauche",
  "Left Back":        "Latéral gauche",
  "Right-Back":       "Latéral droit",
  "Right Back":       "Latéral droit",
  "Defensive Midfield": "Milieu défensif",
  "Central Midfield": "Milieu central",
  "Attacking Midfield": "Milieu offensif",
  "Left Winger":      "Ailier gauche",
  "Left Wing":        "Ailier gauche",
  "Right Winger":     "Ailier droit",
  "Right Wing":       "Ailier droit",
  "Centre-Forward":   "Attaquant",
  "Centre Forward":   "Attaquant",
  "Second Striker":   "Attaquant",
  "Striker":          "Attaquant",
};

const SS_POS: Record<string, string> = {
  G: "Gardien", D: "Défenseur central", M: "Milieu central", F: "Attaquant",
};

const tmFetch = (path: string) =>
  fetch(`${TM_BASE}${path}`, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    signal: AbortSignal.timeout(10000),
  });

const ssFetch = (path: string) =>
  fetch(`${SS_BASE}${path}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://www.sofascore.com/",
      "Origin": "https://www.sofascore.com",
    },
    signal: AbortSignal.timeout(10000),
  });

Deno.serve(async (req) => {
  try {
    const { playerName } = await req.json();
    if (!playerName) return Response.json({ error: "playerName requis" }, { status: 400 });

    const result: Record<string, unknown> = {};
    const sources: string[] = [];
    const errors: string[] = [];

    // ════════════════════════════════════════════════════════════════
    // 1. TRANSFERMARKT — infos personnelles + valeur marchande
    // ════════════════════════════════════════════════════════════════
    try {
      const searchRes = await tmFetch(`/players/search/${encodeURIComponent(playerName)}`);
      if (!searchRes.ok) throw new Error(`HTTP ${searchRes.status}`);
      const searchData = await searchRes.json();
      const first = searchData?.results?.[0];

      if (first) {
        const tmId = String(first.id);
        sources.push("Transfermarkt");
        result.transfermarkt_id = tmId;

        // Champs de base depuis la recherche
        if (first.name)                       result.nom             = first.name;
        const posMain = first.position?.main ?? first.position;
        if (posMain)                           result.poste           = TM_POS[posMain] || posMain;
        if (first.age)                         result.age             = first.age;
        if (first.club?.name)                  result.club_actuel     = first.club.name;
        const nat = Array.isArray(first.nationality) ? first.nationality[0] : first.nationality;
        if (nat)                               result.nationalite     = nat;
        const mv = parseTMValue(first.marketValue);
        if (mv !== null)                       result.valeur_marchande = mv;

        // ── Profil complet ────────────────────────────────────────
        try {
          const profRes = await tmFetch(`/players/${tmId}/profile`);
          if (profRes.ok) {
            const p = await profRes.json();

            const dob = p.dateOfBirth?.date ?? p.dateOfBirth;
            if (dob)                              result.date_naissance   = String(dob).substring(0, 10);
            if (p.placeOfBirth?.city)             result.lieu_naissance   = p.placeOfBirth.city;

            const h = parseTMHeight(p.height);
            if (h)                                result.taille           = h;

            if (p.foot) {
              result.pied_fort = p.foot === "left" ? "Gauche"
                               : p.foot === "both" ? "Les deux"
                               : "Droit";
            }

            // Fin de contrat — plusieurs formats possibles
            const expiry = p.contractExpiry ?? p.contract?.expiry ?? p.contractUntil;
            if (expiry)                           result.contrat_fin      = String(expiry);

            if (p.currentClub?.name ?? p.club?.name)
              result.club_actuel = p.currentClub?.name ?? p.club?.name;
            if (p.imageURL)                       result.photo_url        = p.imageURL;
            if (p.shirt ?? p.shirtNumber)         result.numero_maillot   = p.shirt ?? p.shirtNumber;
            if (p.agent?.name)                    result.agent            = p.agent.name;

            const cit = Array.isArray(p.citizenship) ? p.citizenship[0] : p.citizenship;
            if (cit)                              result.nationalite      = cit;

            const mv2 = parseTMValue(p.marketValue);
            if (mv2 !== null)                     result.valeur_marchande = mv2;

            // Position plus précise si disponible
            const pos2 = p.position?.main ?? p.position;
            if (pos2)                             result.poste            = TM_POS[pos2] || pos2;
          }
        } catch (e: any) { errors.push(`TM profile: ${e.message}`); }

        // ── Valeur maximale (historique) ──────────────────────────
        try {
          const mvRes = await tmFetch(`/players/${tmId}/market_value`);
          if (mvRes.ok) {
            const mvData = await mvRes.json();
            const history: any[] = mvData?.marketValueHistory ?? mvData?.history ?? [];
            let peak = 0;
            for (const entry of history) {
              const v = parseTMValue(entry.value ?? entry.marketValue);
              if (v !== null && v > peak) peak = v;
            }
            if (peak > 0) result.valeur_marchande_peak = peak;
          }
        } catch (e: any) { errors.push(`TM market_value: ${e.message}`); }
      }
    } catch (e: any) { errors.push(`Transfermarkt search: ${e.message}`); }

    // ════════════════════════════════════════════════════════════════
    // 2. SOFASCORE — stats de match complètes
    // ════════════════════════════════════════════════════════════════
    try {
      const ssSearchRes = await ssFetch(`/search/all?q=${encodeURIComponent(playerName)}`);
      if (!ssSearchRes.ok) throw new Error(`HTTP ${ssSearchRes.status}`);
      const ssSearch = await ssSearchRes.json();

      const playerHit = (ssSearch?.results ?? []).find((r: any) => r.type === "player");

      if (playerHit?.entity) {
        const entity = playerHit.entity;
        const ssId   = entity.id;
        sources.push("SofaScore");
        result.sofascore_id = String(ssId);

        // Infos perso (complément si TM ne les avait pas)
        if (!result.photo_url && ssId)
          result.photo_url = `https://img.sofascore.com/api/v1/player/${ssId}/image`;
        if (!result.nationalite && entity.country?.name)
          result.nationalite = entity.country.name;
        if (!result.poste && entity.position)
          result.poste = SS_POS[entity.position] || entity.position;
        if (!result.taille && entity.height)
          result.taille = entity.height;
        if (!result.club_actuel && entity.team?.name)
          result.club_actuel = entity.team.name;

        // ── Statistiques saison ───────────────────────────────────
        try {
          const statsRes = await ssFetch(`/player/${ssId}/statistics/season`);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            const seasons: any[] = statsData?.statistics ?? [];

            // Saison la plus récente
            let best: any = null;
            for (const s of seasons) {
              const year = s.season?.year ?? s.tournamentSeasonId ?? 0;
              if (!best || year > (best.season?.year ?? best.tournamentSeasonId ?? 0))
                best = s;
            }

            if (best?.statistics) {
              const st = best.statistics;
              const set = (key: string, val: unknown) => { if (val != null) result[key] = val; };

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

              if (st.expectedGoals != null)
                result.xg = Math.round(st.expectedGoals * 100) / 100;
              if (st.expectedAssists != null)
                result.xa = Math.round(st.expectedAssists * 100) / 100;
              if (st.expectedGoals != null && st.minutesPlayed)
                result.xg_par_90 = Math.round((st.expectedGoals / st.minutesPlayed) * 90 * 100) / 100;

              if (st.accuratePasses != null) {
                result.passes_reussies = st.accuratePasses;
                const total = st.accuratePasses + (st.inaccuratePasses ?? 0);
                if (total > 0) result.passes_reussies_pct = Math.round((st.accuratePasses / total) * 100);
              }
              if (st.groundDuelsWon != null && st.groundDuelsLost != null) {
                const t = st.groundDuelsWon + st.groundDuelsLost;
                if (t > 0) result.duels_gagnes_pct = Math.round((st.groundDuelsWon / t) * 100);
              }
              if (st.aerialDuelsWon != null && st.aerialDuelsLost != null) {
                const t = st.aerialDuelsWon + st.aerialDuelsLost;
                if (t > 0) result.duels_aeriens_pct = Math.round((st.aerialDuelsWon / t) * 100);
              }
              if (st.successfulDribbles != null && (st.totalDribbleAttempts ?? st.attemptedDribbles) != null) {
                const attempts = st.totalDribbleAttempts ?? st.attemptedDribbles;
                if (attempts > 0) result.dribbles_pct = Math.round((st.successfulDribbles / attempts) * 100);
              }
            }
          }
        } catch (e: any) { errors.push(`SofaScore stats: ${e.message}`); }
      }
    } catch (e: any) { errors.push(`SofaScore search: ${e.message}`); }

    // ────────────────────────────────────────────────────────────────
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
