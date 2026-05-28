/**
 * Proxy serveur-side pour API-Football (api-sports.io).
 * La clé API reste côté serveur et n'est jamais exposée au client.
 *
 * Actions disponibles :
 *   searchPlayer   — cherche un joueur par nom, retourne jusqu'à 10 résultats
 *   getPlayer      — données complètes + stats saison par ID joueur
 *   getPlayerFull  — profil complet : 5 saisons + transferts + blessures (parallèle)
 *   searchTeam     — cherche une équipe par nom
 *   getSquad       — effectif d'une équipe par ID
 *   getStandings   — classement d'une ligue pour une saison
 *   getFixtures    — 10 prochains + 5 derniers matchs d'une équipe
 *   getTopScorers  — meilleurs buteurs d'une ligue
 *   getTopAssists  — meilleurs passeurs d'une ligue
 */

const API_KEY = "69289700a254963331e0a79b901c56da";
const BASE    = "https://v3.football.api-sports.io";

const afGet = async (path: string) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-apisports-key": API_KEY },
  });
  const json = await res.json();
  // L'API retourne des erreurs dans json.errors même avec HTTP 200
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football: ${JSON.stringify(json.errors)}`);
  }
  return json;
};

// ── Position mapping ──────────────────────────────────────────────────────────
const POSTES_MAP: Record<string, string> = {
  "Goalkeeper": "Gardien",
  "Defender":   "Défenseur central",
  "Midfielder": "Milieu central",
  "Attacker":   "Attaquant",
};

const parseCm = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const n = parseInt(s.replace(/\D/g, ""));
  return isNaN(n) ? null : n;
};

// Normalise un objet joueur retourné par l'API
const normalizePlayer = (entry: any) => {
  const pl = entry?.player;
  const sts = entry?.statistics || [];
  const st  = sts[0] || null;
  if (!pl) return null;

  return {
    id:             pl.id,
    nom:            pl.name || `${pl.firstname || ""} ${pl.lastname || ""}`.trim(),
    prenom:         pl.firstname,
    nom_famille:    pl.lastname,
    age:            pl.age,
    date_naissance: pl.birth?.date || null,
    lieu_naissance: pl.birth?.place || null,
    pays_naissance: pl.birth?.country || null,
    nationalite:    pl.nationality || null,
    photo_url:      pl.photo || null,
    taille:         parseCm(pl.height),
    poids:          parseCm(pl.weight),
    poste:          POSTES_MAP[st?.games?.position || ""] || null,
    numero_maillot: st?.games?.number || null,
    club_actuel:    st?.team?.name || null,
    club_logo:      st?.team?.logo || null,
    ligue:          st?.league?.name || null,
    pays_ligue:     st?.league?.country || null,
    ligue_logo:     st?.league?.logo || null,
    stats_saison: st ? {
      saison:           st.league?.season ? `${st.league.season}` : null,
      matchs:           st.games?.appearences ?? null,
      titulaire:        st.games?.lineups ?? null,
      minutes:          st.games?.minutes ?? null,
      buts:             st.goals?.total ?? null,
      passes_decisives: st.goals?.assists ?? null,
      cartons_jaunes:   st.cards?.yellow ?? null,
      cartons_rouges:   st.cards?.red ?? null,
      tirs:             st.shots?.total ?? null,
      tirs_cadres:      st.shots?.on ?? null,
      passes_cles:      st.passes?.key ?? null,
      dribbles_tentes:  st.dribbles?.attempts ?? null,
      dribbles_reussis: st.dribbles?.success ?? null,
      tacles:           st.tackles?.total ?? null,
      interceptions:    st.tackles?.interceptions ?? null,
      fautes_commises:  st.fouls?.committed ?? null,
      fautes_subies:    st.fouls?.drawn ?? null,
      penaltys_marques: st.penalty?.scored ?? null,
      buts_encaisses:   st.goals?.conceded ?? null,
      arrets:           st.goals?.saves ?? null,
    } : null,
    // Multi-saison stats pour le profil complet
    toutes_stats: sts.map((s: any) => ({
      saison: s.league?.season ? `${s.league.season}` : null,
      club:   s.team?.name || null,
      ligue:  s.league?.name || null,
      pays:   s.league?.country || null,
      matchs: s.games?.appearences ?? null,
      buts:   s.goals?.total ?? null,
      passes: s.goals?.assists ?? null,
      minutes: s.games?.minutes ?? null,
    })),
  };
};

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const { action, name, id, season, teamId, league } = await req.json();
    const currentSeason = 2025;

    if (action === "searchPlayer") {
      // Tente les 3 dernières saisons disponibles
      for (const s of [currentSeason, currentSeason - 1, currentSeason - 2]) {
        const q = encodeURIComponent((name || "").trim());
        const data = await afGet(`/players?search=${q}&season=${s}`);
        const players = data.response || [];
        if (players.length > 0) {
          return Response.json({
            ok: true,
            season: s,
            total: players.length,
            players: players.slice(0, 10).map(normalizePlayer).filter(Boolean),
          });
        }
      }
      return Response.json({ ok: true, total: 0, players: [] });
    }

    if (action === "getPlayer") {
      if (!id) return Response.json({ ok: false, error: "id requis" });
      // Stats saison courante
      for (const s of [currentSeason, currentSeason - 1]) {
        const data = await afGet(`/players?id=${id}&season=${s}`);
        const entries = data.response || [];
        if (entries.length > 0) {
          return Response.json({ ok: true, season: s, player: normalizePlayer(entries[0]) });
        }
      }
      return Response.json({ ok: false, error: "Joueur non trouvé" });
    }

    if (action === "getPlayerFull") {
      if (!id) return Response.json({ ok: false, error: "id requis" });

      // 7 appels en parallèle : 5 saisons + transferts + blessures
      const seasons = [2025, 2024, 2023, 2022, 2021];
      const results = await Promise.allSettled([
        ...seasons.map(s => afGet(`/players?id=${id}&season=${s}`)),
        afGet(`/transfers?player=${id}`),
        afGet(`/injuries?player=${id}`),
      ]);

      // Extraire les stats de chaque saison
      const toutesStats: any[] = [];
      let bestEntry: any = null;

      for (let i = 0; i < seasons.length; i++) {
        const r = results[i];
        if (r.status === "fulfilled") {
          const entries = r.value?.response || [];
          if (entries.length > 0) {
            const entry = entries[0];
            if (!bestEntry) bestEntry = entry;
            const sts = entry?.statistics || [];
            for (const s of sts) {
              toutesStats.push({
                saison:           s.league?.season ? `${s.league.season}` : `${seasons[i]}`,
                club:             s.team?.name || null,
                ligue:            s.league?.name || null,
                matchs:           s.games?.appearences ?? null,
                buts:             s.goals?.total ?? null,
                passes_decisives: s.goals?.assists ?? null,
                minutes:          s.games?.minutes ?? null,
                cartons_jaunes:   s.cards?.yellow ?? null,
                cartons_rouges:   s.cards?.red ?? null,
                tirs:             s.shots?.total ?? null,
                tirs_cadres:      s.shots?.on ?? null,
                tacles:           s.tackles?.total ?? null,
                interceptions:    s.tackles?.interceptions ?? null,
              });
            }
          }
        }
      }

      // Dédoublonner par saison+club
      const seen = new Set<string>();
      const statsDedup = toutesStats.filter(s => {
        const key = `${s.saison}|${s.club}|${s.ligue}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Transferts (index 5)
      const transfertsRaw = results[5];
      const transferts: any[] = [];
      if (transfertsRaw.status === "fulfilled") {
        const tData = transfertsRaw.value?.response || [];
        if (tData.length > 0) {
          const tList = tData[0]?.transfers || [];
          for (const t of tList) {
            transferts.push({
              date:         t.date || null,
              club_depart:  t.teams?.out?.name || null,
              club_arrivee: t.teams?.in?.name || null,
              type:         t.type || null,
              montant:      null,
            });
          }
        }
      }

      // Blessures (index 6)
      const blessuresRaw = results[6];
      const blessures: any[] = [];
      if (blessuresRaw.status === "fulfilled") {
        const bList = blessuresRaw.value?.response || [];
        for (const b of bList) {
          blessures.push({
            date:   b.fixture?.date || null,
            saison: b.league?.season ? `${b.league.season}` : null,
            type:   b.player?.type || null,
            raison: b.player?.reason || null,
            club:   b.team?.name || null,
            ligue:  b.league?.name || null,
          });
        }
      }

      if (!bestEntry) {
        return Response.json({ ok: false, error: "Joueur non trouvé" });
      }

      return Response.json({
        ok:           true,
        player:       normalizePlayer(bestEntry),
        toutes_stats: statsDedup,
        transferts,
        blessures,
      });
    }

    if (action === "searchTeam") {
      const q = encodeURIComponent((name || "").trim());
      const data = await afGet(`/teams?search=${q}`);
      const teams = (data.response || []).slice(0, 10).map((e: any) => ({
        id:      e.team?.id,
        nom:     e.team?.name,
        pays:    e.team?.country,
        logo:    e.team?.logo,
        annee_fondation: e.team?.founded,
        stade:   e.venue?.name,
        ville:   e.venue?.city,
        capacite_stade: e.venue?.capacity,
        photo_url: e.team?.logo,
      }));
      return Response.json({ ok: true, total: teams.length, teams });
    }

    if (action === "getSquad") {
      if (!teamId) return Response.json({ ok: false, error: "teamId requis" });
      const data = await afGet(`/players/squads?team=${teamId}`);
      const squad = (data.response?.[0]?.players || []).map((p: any) => ({
        id:             p.id,
        nom:            p.name,
        age:            p.age,
        numero_maillot: p.number,
        poste:          POSTES_MAP[p.position] || p.position,
        photo_url:      p.photo,
      }));
      return Response.json({ ok: true, squad });
    }

    if (action === "getStandings") {
      if (!league) return Response.json({ ok: false, error: "league requis" });
      const s = season ?? currentSeason;
      const data = await afGet(`/standings?league=${league}&season=${s}`);
      const rows = data.response?.[0]?.league?.standings?.[0] || [];
      const standings = rows.map((e: any) => ({
        rang:          e.rank,
        equipe:        e.team?.name || null,
        logo:          e.team?.logo || null,
        matchs_joues:  e.all?.played ?? null,
        victoires:     e.all?.win ?? null,
        nuls:          e.all?.draw ?? null,
        defaites:      e.all?.lose ?? null,
        buts_pour:     e.all?.goals?.for ?? null,
        buts_contre:   e.all?.goals?.against ?? null,
        points:        e.points ?? null,
        forme:         e.form || null,
      }));
      return Response.json({ ok: true, standings });
    }

    if (action === "getFixtures") {
      if (!teamId) return Response.json({ ok: false, error: "teamId requis" });
      const s = season ?? currentSeason;

      const normalizeFixture = (f: any) => ({
        date:              f.fixture?.date || null,
        stade:             f.fixture?.venue?.name || null,
        equipe_domicile:   f.teams?.home?.name || null,
        logo_domicile:     f.teams?.home?.logo || null,
        equipe_exterieur:  f.teams?.away?.name || null,
        logo_exterieur:    f.teams?.away?.logo || null,
        score_domicile:    f.goals?.home ?? null,
        score_exterieur:   f.goals?.away ?? null,
        statut:            f.fixture?.status?.short || null,
        ligue:             f.league?.name || null,
      });

      const [nextData, lastData] = await Promise.allSettled([
        afGet(`/fixtures?team=${teamId}&season=${s}&next=10`),
        afGet(`/fixtures?team=${teamId}&season=${s}&last=5`),
      ]);

      const prochains = nextData.status === "fulfilled"
        ? (nextData.value?.response || []).map(normalizeFixture)
        : [];
      const recents = lastData.status === "fulfilled"
        ? (lastData.value?.response || []).map(normalizeFixture)
        : [];

      return Response.json({ ok: true, prochains, recents });
    }

    if (action === "getTopScorers") {
      if (!league) return Response.json({ ok: false, error: "league requis" });
      const s = season ?? currentSeason;
      const data = await afGet(`/players/topscorers?league=${league}&season=${s}`);
      const players = (data.response || []).slice(0, 20).map(normalizePlayer).filter(Boolean);
      return Response.json({ ok: true, players });
    }

    if (action === "getTopAssists") {
      if (!league) return Response.json({ ok: false, error: "league requis" });
      const s = season ?? currentSeason;
      const data = await afGet(`/players/topassists?league=${league}&season=${s}`);
      const players = (data.response || []).slice(0, 20).map(normalizePlayer).filter(Boolean);
      return Response.json({ ok: true, players });
    }

    return Response.json({ ok: false, error: `Action inconnue: ${action}` });

  } catch (err: any) {
    console.error("apiFootballProxy error:", err.message);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
});
