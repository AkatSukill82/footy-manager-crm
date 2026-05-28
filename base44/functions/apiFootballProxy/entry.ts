/**
 * Proxy serveur-side pour API-Football (api-sports.io).
 * La clé API reste côté serveur et n'est jamais exposée au client.
 *
 * Actions disponibles :
 *   searchPlayer  — cherche un joueur par nom, retourne jusqu'à 10 résultats
 *   getPlayer     — données complètes + stats saison par ID joueur
 *   searchTeam    — cherche une équipe par nom
 *   getSquad      — effectif d'une équipe par ID
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
    const { action, name, id, season, teamId } = await req.json();
    const currentSeason = 2024;

    if (action === "searchPlayer") {
      // Tente la saison courante, puis la précédente si aucun résultat
      for (const s of [currentSeason, currentSeason - 1]) {
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

    return Response.json({ ok: false, error: `Action inconnue: ${action}` });

  } catch (err: any) {
    console.error("apiFootballProxy error:", err.message);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
});
