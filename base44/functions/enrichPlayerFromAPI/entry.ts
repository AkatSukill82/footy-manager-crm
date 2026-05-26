/**
 * Enrichit un joueur depuis :
 *  1. TheSportsDB (gratuit) — photo, bio, réseaux sociaux
 *  2. API-Football / api-sports.io — stats complètes, club, ligue
 *
 * Usage : base44.functions.invoke("enrichPlayerFromAPI", { playerName })
 */

const AF_KEY = "69289700a254963331e0a79b901c56da";

const POSTES_MAP: Record<string, string> = {
  'goalkeeper': 'Gardien', 'goalie': 'Gardien',
  'center back': 'Défenseur central', 'centre back': 'Défenseur central', 'defender': 'Défenseur central',
  'right back': 'Latéral droit', 'right-back': 'Latéral droit',
  'left back': 'Latéral gauche', 'left-back': 'Latéral gauche',
  'defensive midfielder': 'Milieu défensif', 'defensive mid': 'Milieu défensif',
  'midfielder': 'Milieu central', 'central midfielder': 'Milieu central',
  'attacking midfielder': 'Milieu offensif',
  'right wing': 'Ailier droit', 'right winger': 'Ailier droit',
  'left wing': 'Ailier gauche', 'left winger': 'Ailier gauche',
  'forward': 'Attaquant', 'striker': 'Attaquant', 'centre forward': 'Attaquant',
  // API-Football position keys
  'Goalkeeper': 'Gardien',
  'Defender':   'Défenseur central',
  'Midfielder': 'Milieu central',
  'Attacker':   'Attaquant',
};

Deno.serve(async (req) => {
  try {
    const { playerName } = await req.json();
    if (!playerName) return Response.json({ error: 'playerName requis' }, { status: 400 });

    const result: Record<string, unknown> = {};
    const sources: string[] = [];

    // ── 1. TheSportsDB (photo, social) ───────────────────────────────
    try {
      const encoded = encodeURIComponent(playerName);
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encoded}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const p = data?.players?.[0];
        if (p) {
          sources.push('TheSportsDB');
          if (p.strThumb)         result.photo_url     = p.strThumb;
          if (p.strNationality)   result.nationalite   = p.strNationality;
          if (p.dateBorn)         result.date_naissance = p.dateBorn.substring(0, 10);
          if (p.strInsta)         result.instagram     = `@${p.strInsta.replace('@', '')}`;
          if (p.strTwitter)       result.twitter       = `@${p.strTwitter.replace('@', '')}`;
          if (p.strDescriptionEN) result.stats_resume  = p.strDescriptionEN.substring(0, 800);
          const posLow = (p.strPosition || '').toLowerCase().trim();
          if (POSTES_MAP[posLow]) result.poste = POSTES_MAP[posLow];
          if (p.strHeight) {
            const h = parseFloat(p.strHeight.replace(',', '.'));
            if (!isNaN(h)) result.taille = h < 3 ? Math.round(h * 100) : Math.round(h);
          }
          if (p.strWeight) {
            const w = parseFloat(p.strWeight);
            if (!isNaN(w)) result.poids = Math.round(w);
          }
        }
      }
    } catch (e) { console.error('TheSportsDB error:', e); }

    // ── 2. API-Football (stats complètes) ────────────────────────────
    try {
      const q = encodeURIComponent(playerName);
      const afHeaders = { 'x-apisports-key': AF_KEY };
      let entry: any = null;

      // Tente 2024 puis 2023
      for (const season of [2024, 2023]) {
        const res = await fetch(
          `https://v3.football.api-sports.io/players?search=${q}&season=${season}`,
          { headers: afHeaders }
        );
        if (!res.ok) continue;
        const data = await res.json();
        if (data.response?.length > 0) { entry = data.response[0]; break; }
      }

      if (entry) {
        sources.push('API-Football');
        const pl = entry.player;
        const st = entry.statistics?.[0];

        if (pl.photo && !result.photo_url) result.photo_url      = pl.photo;
        if (pl.name)                        result.nom            = pl.name;
        if (pl.firstname && pl.lastname)    result.nom            = `${pl.firstname} ${pl.lastname}`;
        if (pl.age)                         result.age            = pl.age;
        if (pl.birth?.date)                 result.date_naissance = pl.birth.date;
        if (pl.birth?.place)                result.lieu_naissance = pl.birth.place;
        if (pl.nationality)                 result.nationalite    = pl.nationality;
        if (pl.height) { const h = parseInt(pl.height); if (!isNaN(h)) result.taille = h; }
        if (pl.weight) { const w = parseInt(pl.weight); if (!isNaN(w)) result.poids  = w; }

        if (st) {
          if (st.team?.name && !result.club_actuel)  result.club_actuel = st.team.name;
          if (st.league?.name)                        result.ligue       = st.league.name;
          if (st.league?.country)                     result.pays_ligue  = st.league.country;
          if (st.games?.position) {
            const pos = POSTES_MAP[st.games.position];
            if (pos) result.poste = pos;
          }
          if (st.games?.appearences != null) result.matchs_joues     = st.games.appearences;
          if (st.games?.lineups != null)     result.titularisations  = st.games.lineups;
          if (st.games?.minutes != null)     result.minutes_jouees   = st.games.minutes;
          if (st.goals?.total != null)       result.buts             = st.goals.total;
          if (st.goals?.assists != null)     result.passes_decisives = st.goals.assists;
          if (st.cards?.yellow != null)      result.cartons_jaunes   = st.cards.yellow;
          if (st.cards?.red != null)         result.cartons_rouges   = st.cards.red;
          if (st.shots?.total)               result.tirs             = st.shots.total;
          if (st.shots?.on)                  result.tirs_cadres      = st.shots.on;
          if (st.passes?.key)                result.passes_cles      = st.passes.key;
          if (st.dribbles?.success)          result.dribbles_reussis = st.dribbles.success;
          if (st.tackles?.total)             result.tacles           = st.tackles.total;
          if (st.tackles?.interceptions)     result.interceptions    = st.tackles.interceptions;
          if (st.fouls?.committed)           result.fautes_commises  = st.fouls.committed;
          if (st.fouls?.drawn)               result.fautes_subies    = st.fouls.drawn;
          if (st.goals?.conceded != null)    result.buts_encaisses   = st.goals.conceded;
          if (st.goals?.saves != null)       result.arrets           = st.goals.saves;
          if (st.penalty?.scored != null)    result.penaltys_marques = st.penalty.scored;
          if (st.dribbles?.attempts && st.dribbles?.success) {
            result.dribbles_tentes = st.dribbles.attempts;
          }
        }
      }
    } catch (e) { console.error('API-Football error:', e); }

    const fieldsFound = Object.keys(result).filter(k => result[k] != null && result[k] !== '').length;

    return Response.json({ success: true, fieldsFound, data: result, sources });

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
