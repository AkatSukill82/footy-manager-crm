/**
 * Enrichit un joueur depuis des APIs football gratuites :
 *  1. TheSportsDB (gratuit, sans clé) — photo, bio, poste, club, social
 *  2. API-Football via RapidAPI (optionnel — passer apiFootballKey dans le body)
 *
 * Usage : base44.functions.invoke("enrichPlayerFromAPI", { playerName, apiFootballKey? })
 */
Deno.serve(async (req) => {
  try {
    const { playerName, apiFootballKey } = await req.json();
    if (!playerName) return Response.json({ error: 'playerName requis' }, { status: 400 });

    const result: Record<string, unknown> = {};

    // ── 1. TheSportsDB (gratuit) ─────────────────────────────────────
    try {
      const encoded = encodeURIComponent(playerName);
      const tsdbRes = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encoded}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      if (tsdbRes.ok) {
        const tsdbData = await tsdbRes.json();
        const p = tsdbData?.players?.[0];
        if (p) {
          if (p.strThumb)          result.photo_url             = p.strThumb;
          if (p.strNationality)    result.nationalite            = p.strNationality;
          if (p.dateBorn)          result.date_naissance         = p.dateBorn.substring(0, 10);
          if (p.strPosition)       result.poste_raw_tsdb         = p.strPosition; // mapped below
          if (p.strTeam)           result.club_actuel_tsdb       = p.strTeam;
          if (p.strHeight)         result.taille_raw             = p.strHeight; // "1.81 m" → parsed
          if (p.strWeight)         result.poids_raw              = p.strWeight;
          if (p.strInsta)          result.instagram              = `@${p.strInsta.replace('@', '')}`;
          if (p.strTwitter)        result.twitter                = `@${p.strTwitter.replace('@', '')}`;
          if (p.strDescriptionEN)  result.stats_resume           = p.strDescriptionEN.substring(0, 800);
          if (p.strNationality)    result.pays_residence         = p.strNationality;
          if (p.idPlayer)          result.thesportsdb_id         = String(p.idPlayer);

          // Parse height (e.g. "1.81 m" or "181cm")
          if (p.strHeight) {
            const h = parseFloat(p.strHeight.replace(',', '.'));
            if (!isNaN(h)) result.taille = h < 3 ? Math.round(h * 100) : Math.round(h);
          }
          // Parse weight (e.g. "73 kg")
          if (p.strWeight) {
            const w = parseFloat(p.strWeight);
            if (!isNaN(w)) result.poids = Math.round(w);
          }

          // Map position string to our enum
          const posMap: Record<string, string> = {
            'goalkeeper': 'Gardien',
            'goalie': 'Gardien',
            'center back': 'Défenseur central', 'centre back': 'Défenseur central',
            'defender': 'Défenseur central',
            'right back': 'Latéral droit', 'right-back': 'Latéral droit',
            'left back': 'Latéral gauche', 'left-back': 'Latéral gauche',
            'defensive midfielder': 'Milieu défensif', 'defensive mid': 'Milieu défensif',
            'midfielder': 'Milieu central', 'central midfielder': 'Milieu central', 'center midfielder': 'Milieu central',
            'attacking midfielder': 'Milieu offensif', 'attacking mid': 'Milieu offensif',
            'right wing': 'Ailier droit', 'right winger': 'Ailier droit',
            'left wing': 'Ailier gauche', 'left winger': 'Ailier gauche',
            'forward': 'Attaquant', 'striker': 'Attaquant', 'centre forward': 'Attaquant', 'center forward': 'Attaquant',
          };
          const posLower = (p.strPosition || '').toLowerCase().trim();
          if (posMap[posLower]) result.poste = posMap[posLower];
        }
      }
    } catch (e) {
      console.error('TheSportsDB error:', e);
    }

    // ── 2. API-Football via RapidAPI (optionnel) ────────────────────
    if (apiFootballKey) {
      try {
        const searchRes = await fetch(
          `https://api-football-v1.p.rapidapi.com/v3/players?search=${encodeURIComponent(playerName)}&league=0`,
          {
            headers: {
              'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
              'x-rapidapi-key': apiFootballKey,
            },
          }
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const entry = searchData?.response?.[0];
          if (entry) {
            const pl = entry.player;
            const st = entry.statistics?.[0];

            if (pl.photo && !result.photo_url)  result.photo_url      = pl.photo;
            if (pl.name)                         result.nom            = pl.name;
            if (pl.firstname && pl.lastname)     result.nom            = `${pl.firstname} ${pl.lastname}`;
            if (pl.age)                          result.age            = pl.age;
            if (pl.birth?.date)                  result.date_naissance = pl.birth.date;
            if (pl.birth?.place)                 result.lieu_naissance = pl.birth.place;
            if (pl.birth?.country)               result.nationalite    = pl.birth.country;
            if (pl.nationality)                  result.nationalite    = pl.nationality;
            if (pl.height) {
              const h = parseFloat((pl.height || '').replace('cm', '').replace(' ', ''));
              if (!isNaN(h)) result.taille = h;
            }
            if (pl.weight) {
              const w = parseFloat((pl.weight || '').replace('kg', '').replace(' ', ''));
              if (!isNaN(w)) result.poids = w;
            }
            if (st?.team?.name && !result.club_actuel)  result.club_actuel = st.team.name;
            if (st?.league?.name)                        result.ligue       = st.league.name;
            if (st?.league?.country)                     result.pays_ligue  = st.league.country;
            if (st?.games?.position) {
              const posMap2: Record<string, string> = {
                'Goalkeeper': 'Gardien', 'Defender': 'Défenseur central',
                'Midfielder': 'Milieu central', 'Attacker': 'Attaquant',
              };
              result.poste = posMap2[st.games.position] || st.games.position;
            }
            // Stats saison
            if (st?.games?.appearences)   result.matchs_joues      = st.games.appearences;
            if (st?.games?.lineups)        result.titularisations   = st.games.lineups;
            if (st?.games?.minutes)        result.minutes_jouees    = st.games.minutes;
            if (st?.goals?.total != null)  result.buts              = st.goals.total;
            if (st?.goals?.assists != null)result.passes_decisives  = st.goals.assists;
            if (st?.cards?.yellow != null) result.cartons_jaunes    = st.cards.yellow;
            if (st?.cards?.red != null)    result.cartons_rouges    = st.cards.red;
            if (st?.shots?.total)          result.tirs              = st.shots.total;
            if (st?.shots?.on)             result.tirs_cadres       = st.shots.on;
            if (st?.passes?.total)         result.passes_reussies   = st.passes.total;
            if (st?.passes?.accuracy)      result.passes_reussies_pct = st.passes.accuracy;
            if (st?.passes?.key)           result.passes_cles       = st.passes.key;
            if (st?.dribbles?.attempts)    result.dribbles_tentes   = st.dribbles.attempts;
            if (st?.dribbles?.success)     result.dribbles_reussis  = st.dribbles.success;
            if (st?.tackles?.total)        result.tacles            = st.tackles.total;
            if (st?.tackles?.interceptions)result.interceptions     = st.tackles.interceptions;
            if (st?.fouls?.committed)      result.fautes_commises   = st.fouls.committed;
            if (st?.fouls?.drawn)          result.fautes_subies     = st.fouls.drawn;
            if (st?.duels?.won && st?.duels?.total) {
              result.duels_gagnes_pct = Math.round((st.duels.won / st.duels.total) * 100);
            }
            if (st?.penalty?.scored != null) result.penaltys_marques = st.penalty.scored;
            if (st?.penalty?.won != null)    result.penaltys_provoques = st.penalty.won;
            if (st?.penalty?.missed != null) {
              result.penaltys_tires = (st.penalty.scored || 0) + (st.penalty.missed || 0);
            }
            // Gardien
            if (st?.goals?.conceded != null) result.buts_encaisses = st.goals.conceded;
            if (st?.goals?.saves != null)    result.arrets          = st.goals.saves;
          }
        }
      } catch (e) {
        console.error('API-Football error:', e);
      }
    }

    // Cleanup raw fields
    delete result.poste_raw_tsdb;
    delete result.club_actuel_tsdb;
    delete result.taille_raw;
    delete result.poids_raw;

    const fieldsFound = Object.keys(result).filter(k => result[k] != null && result[k] !== '').length;

    return Response.json({
      success: true,
      fieldsFound,
      data: result,
      sources: [
        'TheSportsDB',
        ...(apiFootballKey ? ['API-Football (RapidAPI)'] : []),
      ],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
