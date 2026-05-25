/* ============================================
   TRANSFERMARKT API SERVICE
   Calls https://transfermarkt-api.fly.dev via the "proxyTMApi" Deno function
   (the API blocks direct browser requests — CORS not enabled).
   ============================================ */

import { base44 } from "@/api/base44Client";

const TransfermarktAPI = {

  // ── All requests go through the Deno server-side proxy ──────────────────
  async _call(path) {
    const res = await base44.functions.invoke("proxyTMApi", { path });
    if (res?.error) throw new Error(res.error);
    return res;
  },

  // ── Formatters ───────────────────────────────────────────────────────────
  formatValue(val) {
    if (!val) return '—';
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1).replace('.0', '') + 'M€';
    if (val >= 1_000)     return (val / 1_000).toFixed(0) + 'k€';
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
    };
    return map[pos] || pos || '';
  },

  mapFoot(foot) {
    const m = { right: 'Droit', left: 'Gauche', both: 'Les deux' };
    return m[(foot || '').toLowerCase()] || foot || '';
  },

  // "Jun 24, 1987" → "1987-06"
  parseTMDate(str) {
    if (!str) return null;
    try {
      const d = new Date(str);
      if (isNaN(d.getTime())) return null;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } catch { return null; }
  },

  // ── API endpoints ────────────────────────────────────────────────────────
  async searchPlayers(query, page = 1) {
    return this._call(`/players/search/${encodeURIComponent(query)}?page_number=${page}`);
  },

  async getProfile(tmId) {
    return this._call(`/players/${tmId}/profile`);
  },

  async getStats(tmId) {
    return this._call(`/players/${tmId}/stats`);
  },

  async getMarketValue(tmId) {
    return this._call(`/players/${tmId}/market_value`);
  },

  async getTransfers(tmId) {
    return this._call(`/players/${tmId}/transfers`);
  },

  async getFullPlayerData(tmId) {
    const [profile, stats, marketValue, transfers] = await Promise.allSettled([
      this.getProfile(tmId),
      this.getStats(tmId),
      this.getMarketValue(tmId),
      this.getTransfers(tmId),
    ]);
    return {
      profile:     profile.status     === 'fulfilled' ? profile.value     : null,
      stats:       stats.status       === 'fulfilled' ? stats.value       : null,
      marketValue: marketValue.status === 'fulfilled' ? marketValue.value : null,
      transfers:   transfers.status   === 'fulfilled' ? transfers.value   : null,
    };
  },

  // ── Stats helpers ─────────────────────────────────────────────────────────
  _extractMainStats(statsData) {
    if (!statsData?.stats?.length) return {};
    const latest = statsData.stats[0];
    const competitions = latest?.competitions || [];
    if (!competitions.length) return {};
    const total = { matchs: 0, buts: 0, passes: 0, minutes: 0, jaunes: 0, rouges: 0 };
    competitions.forEach(c => {
      total.matchs  += c.appearances   || 0;
      total.buts    += c.goals         || 0;
      total.passes  += c.assists       || 0;
      total.minutes += c.minutesPlayed || 0;
      total.jaunes  += c.yellowCards   || 0;
      total.rouges  += c.redCards      || 0;
    });
    return {
      ...total,
      ligue:  competitions[0]?.competitionName || '',
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

  // ── Build CRM Player object from TM API data ─────────────────────────────
  buildCRMPlayer(profile, stats, marketValue, transfers) {
    const mainStats = this._extractMainStats(stats);

    // Market value history
    const valeur_historique = (marketValue?.marketValueHistory || [])
      .map(h => ({ date: this.parseTMDate(h.date), valeur: this.toMillion(h.marketValue) }))
      .filter(h => h.date && h.valeur);

    const peakValue = valeur_historique.length
      ? Math.max(...valeur_historique.map(h => h.valeur), this.toMillion(profile?.marketValue || 0))
      : this.toMillion(profile?.marketValue || 0);

    // Transfer history (fix: use clubTo.name not to.clubName)
    const historique_clubs = (transfers?.transfers || []).map(t => ({
      club:              t.clubTo?.name      || '',
      debut:             this.parseTMDate(t.date),
      fin:               null,
      montant_transfert: t.fee?.value         ? this.toMillion(t.fee.value) : null,
      type_passage:      t.fee?.isLoan        ? 'Prêt'
                       : t.fee?.isFree        ? 'Libre'
                       : t.fee?.value         ? 'Transfert'
                       : 'Transfert',
      ligue:             t.clubTo?.leagueName || '',
      pays:              t.clubTo?.country    || '',
    })).filter(c => c.club);

    // Season stats per competition
    const stats_par_saison = (stats?.stats || []).flatMap(season =>
      (season.competitions || []).map(comp => ({
        saison:  season.seasonName  || '',
        club:    profile?.club?.name || '',
        ligue:   comp.competitionName || '',
        matchs:  comp.appearances || 0,
        buts:    comp.goals       || 0,
        passes:  comp.assists     || 0,
        minutes: comp.minutesPlayed || 0,
        cartons_jaunes: comp.yellowCards || 0,
        cartons_rouges: comp.redCards    || 0,
      }))
    );

    // Current season summary (for display card)
    const stats_saison = mainStats.matchs > 0 ? {
      saison:           mainStats.saison,
      matchs:           mainStats.matchs,
      buts:             mainStats.buts,
      passes_decisives: mainStats.passes,
      minutes:          mainStats.minutes,
      cartons_jaunes:   mainStats.jaunes,
      cartons_rouges:   mainStats.rouges,
    } : null;

    return {
      nom:                  profile?.name        || '',
      nom_complet:          profile?.fullName || profile?.nameInHomeCountry || profile?.name || '',
      age:                  profile?.dateOfBirth ? this._calcAge(profile.dateOfBirth) : (profile?.age || null),
      date_naissance:       profile?.dateOfBirth || null,
      lieu_naissance:       profile?.placeOfBirth
        ? [profile.placeOfBirth.city, profile.placeOfBirth.country].filter(Boolean).join(', ')
        : '',
      poste:                this.mapPosition(profile?.position?.main || ''),
      poste_secondaire:     profile?.position?.other?.[0]
        ? this.mapPosition(profile.position.other[0]) : '',
      nationalite:          (profile?.citizenship || profile?.nationality || [])[0] || '',
      nationalite_secondaire: (profile?.citizenship || profile?.nationality || [])[1] || '',
      club_actuel:          profile?.club?.name     || '',
      ligue:                mainStats.ligue         || '',
      pays_ligue:           profile?.club?.country  || '',
      contrat_fin:          profile?.club?.contractExpires || '',
      valeur_marchande:     this.toMillion(profile?.marketValue),
      valeur_marchande_peak: peakValue || null,
      pied_fort:            this.mapFoot(profile?.foot),
      taille:               profile?.height         || null,
      numero_maillot:       profile?.shirtNumber
        ? parseInt(String(profile.shirtNumber).replace(/\D/g, ''), 10) || null : null,
      agent:                profile?.agent?.name    || '',
      photo_url:            profile?.imageUrl       || '',
      transfermarkt_id:     String(profile?.id      || ''),
      description:          profile?.description    || null,
      // Current season stats (flat for saving)
      matchs_joues:         mainStats.matchs        || 0,
      buts:                 mainStats.buts          || 0,
      passes_decisives:     mainStats.passes        || 0,
      minutes_jouees:       mainStats.minutes       || 0,
      cartons_jaunes:       mainStats.jaunes        || 0,
      cartons_rouges:       mainStats.rouges        || 0,
      // Display objects
      stats_saison,
      valeur_historique,
      historique_clubs,
      stats_par_saison,
    };
  },
};

export default TransfermarktAPI;
