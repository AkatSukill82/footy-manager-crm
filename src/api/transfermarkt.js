/* ============================================
   TRANSFERMARKT API SERVICE
   Base: https://transfermarkt-api.fly.dev
   Données 100% réelles et à jour
   ============================================ */

const TransfermarktAPI = {
  BASE: '/api/tm',

  formatValue(val) {
    if (!val) return '-';
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1).replace('.0', '') + 'M€';
    if (val >= 1_000) return (val / 1_000).toFixed(0) + 'k€';
    return val + '€';
  },

  toMillion(val) {
    if (!val) return 0;
    return Math.round(val / 100_000) / 10;
  },

  mapPosition(pos) {
    const map = {
      'Goalkeeper': 'Gardien',
      'Centre-Back': 'Défenseur central',
      'Left-Back': 'Latéral gauche',
      'Right-Back': 'Latéral droit',
      'Defensive Midfield': 'Milieu défensif',
      'Central Midfield': 'Milieu central',
      'Attacking Midfield': 'Milieu offensif',
      'Left Midfield': 'Milieu offensif',
      'Right Midfield': 'Milieu offensif',
      'Left Winger': 'Ailier gauche',
      'Right Winger': 'Ailier droit',
      'Centre-Forward': 'Attaquant',
      'Second Striker': 'Attaquant',
      'AM': 'Milieu offensif',
      'CM': 'Milieu central',
      'CF': 'Attaquant',
    };
    return map[pos] || pos || 'Milieu central';
  },

  mapFoot(foot) {
    const m = { right: 'Droit', left: 'Gauche', both: 'Les deux' };
    return m[(foot || '').toLowerCase()] || foot || 'Droit';
  },

  // Parse TM date format "Jan 1, 2020" → "2020-01"
  parseTMDate(str) {
    if (!str) return null;
    try {
      const d = new Date(str);
      if (isNaN(d)) return null;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } catch { return null; }
  },

  // ==================== SEARCH ====================
  async searchPlayers(query, page = 1) {
    const url = `${this.BASE}/players/search/${encodeURIComponent(query)}?page_number=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erreur API Transfermarkt');
    return await res.json();
  },

  // ==================== PROFIL COMPLET ====================
  async getProfile(tmId) {
    const res = await fetch(`${this.BASE}/players/${tmId}/profile`);
    if (!res.ok) throw new Error('Joueur introuvable');
    return await res.json();
  },

  // ==================== STATS ====================
  async getStats(tmId) {
    const res = await fetch(`${this.BASE}/players/${tmId}/stats`);
    if (!res.ok) return null;
    return await res.json();
  },

  // ==================== VALEUR MARCHANDE ====================
  async getMarketValue(tmId) {
    const res = await fetch(`${this.BASE}/players/${tmId}/market_value`);
    if (!res.ok) return null;
    return await res.json();
  },

  // ==================== TRANSFERTS ====================
  async getTransfers(tmId) {
    const res = await fetch(`${this.BASE}/players/${tmId}/transfers`);
    if (!res.ok) return null;
    return await res.json();
  },

  // ==================== TOUT EN UNE FOIS ====================
  async getFullPlayerData(tmId) {
    const [profile, stats, marketValue, transfers] = await Promise.allSettled([
      this.getProfile(tmId),
      this.getStats(tmId),
      this.getMarketValue(tmId),
      this.getTransfers(tmId),
    ]);
    return {
      profile: profile.status === 'fulfilled' ? profile.value : null,
      stats: stats.status === 'fulfilled' ? stats.value : null,
      marketValue: marketValue.status === 'fulfilled' ? marketValue.value : null,
      transfers: transfers.status === 'fulfilled' ? transfers.value : null,
    };
  },

  // Extraire stats agrégées de la saison la plus récente
  _extractMainStats(statsData) {
    if (!statsData?.stats?.length) return {};
    const latest = statsData.stats[0];
    const competitions = latest?.competitions || [];
    if (!competitions.length) return {};
    let total = { matchs: 0, buts: 0, passes: 0, minutes: 0 };
    competitions.forEach(c => {
      total.matchs  += c.appearances    || 0;
      total.buts    += c.goals          || 0;
      total.passes  += c.assists        || 0;
      total.minutes += c.minutesPlayed  || 0;
    });
    return {
      matchs: total.matchs, buts: total.buts,
      passes: total.passes, minutes: total.minutes,
      ligue: competitions[0]?.competitionName || '',
      saison: latest?.seasonName || '',
    };
  },

  _calcAge(dob) {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  },

  // Convertir données TM → format CRM Player
  buildCRMPlayer(profile, stats, marketValue, transfers) {
    const mainStats = this._extractMainStats(stats);

    // Historique valeur marchande
    const valeur_historique = (marketValue?.marketValueHistory || [])
      .map(h => ({ date: this.parseTMDate(h.date), valeur: this.toMillion(h.marketValue) }))
      .filter(h => h.date && h.valeur);

    const peakValue = valeur_historique.length
      ? Math.max(...valeur_historique.map(h => h.valeur), this.toMillion(profile?.marketValue || 0))
      : this.toMillion(profile?.marketValue || 0);

    // Historique clubs depuis les transferts
    const historique_clubs = (transfers?.transfers || []).map(t => ({
      club: t.to?.clubName || '',
      debut: t.date ? t.date.substring(0, 7) : null,
      fin: null,
      montant_transfert: t.fee?.value ? this.toMillion(t.fee.value) : null,
      type_passage: t.fee?.value ? 'Transfert' : (t.loan ? 'Prêt' : 'Transfert'),
      ligue: t.to?.leagueName || '',
      pays: t.to?.country || '',
    })).filter(c => c.club);

    // Stats par saison
    const stats_par_saison = (stats?.stats || []).flatMap(season =>
      (season.competitions || []).map(comp => ({
        saison: season.seasonName || '',
        club: profile?.club?.name || '',
        ligue: comp.competitionName || '',
        matchs: comp.appearances || 0,
        buts: comp.goals || 0,
        passes: comp.assists || 0,
        minutes: comp.minutesPlayed || 0,
      }))
    );

    return {
      nom: profile?.name || '',
      age: profile?.dateOfBirth ? this._calcAge(profile.dateOfBirth) : (profile?.age || null),
      date_naissance: profile?.dateOfBirth || null,
      lieu_naissance: profile?.placeOfBirth
        ? [profile.placeOfBirth.city, profile.placeOfBirth.country].filter(Boolean).join(', ')
        : '',
      poste: this.mapPosition(profile?.position?.main || ''),
      poste_secondaire: profile?.position?.other?.[0]
        ? this.mapPosition(profile.position.other[0]) : '',
      nationalite: profile?.citizenship?.[0] || '',
      nationalite_secondaire: profile?.citizenship?.[1] || '',
      club_actuel: profile?.club?.name || '',
      ligue: mainStats.ligue || '',
      pays_ligue: profile?.club?.country || '',
      contrat_fin: profile?.club?.contractExpires || '',
      valeur_marchande: this.toMillion(profile?.marketValue),
      valeur_marchande_peak: peakValue || null,
      pied_fort: this.mapFoot(profile?.foot),
      taille: profile?.height || null,
      numero_maillot: profile?.shirtNumber
        ? parseInt(String(profile.shirtNumber).replace('#', '')) : null,
      agent: profile?.agent?.name || '',
      photo_url: profile?.imageUrl || '',
      transfermarkt_id: String(profile?.id || ''),
      matchs_joues: mainStats.matchs || 0,
      buts: mainStats.buts || 0,
      passes_decisives: mainStats.passes || 0,
      minutes_jouees: mainStats.minutes || 0,
      // Historiques
      valeur_historique,
      historique_clubs,
      stats_par_saison,
    };
  },
};

export default TransfermarktAPI;
