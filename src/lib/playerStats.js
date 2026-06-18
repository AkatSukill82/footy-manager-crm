/**
 * Logique de comparaison statistique des joueurs.
 *
 * Deux niveaux de normalisation, comme les outils pro (StatsBomb, Comparisonator) :
 *  1. per-90 : les stats de volume (buts, tacles…) sont ramenées à 90 minutes
 *     pour comparer équitablement un titulaire et un remplaçant.
 *  2. percentile : chaque valeur est positionnée (0-100) face au vivier de
 *     joueurs du même poste. 80 = « meilleur que 80% des joueurs comparables ».
 *
 * Si le vivier est trop petit pour des percentiles fiables, on bascule sur une
 * normalisation relative aux joueurs comparés (toujours lisible).
 */

// Poste précis → groupe de comparaison
export const POSITION_GROUP = {
  "Gardien": "GK",
  "Défenseur central": "DEF", "Latéral droit": "DEF", "Latéral gauche": "DEF",
  "Milieu défensif": "MID", "Milieu central": "MID", "Milieu offensif": "MID",
  "Ailier droit": "ATT", "Ailier gauche": "ATT", "Attaquant": "ATT",
};

const S = (key, label, { per90 = false, invert = false, derived = null } = {}) =>
  ({ key, label, per90, invert, derived });

// Jeux d'axes par groupe de poste (les plus parlants pour chaque rôle).
// Enrichis avec les stats avancées FotMob/SofaScore/BeSoccer.
export const RADAR_STATS = {
  GK: [
    S("arrets", "Arrêts", { per90: true }),
    S("arrets_pct", "% arrêts"),
    S("clean_sheets", "Clean sheets", { per90: true }),
    S("sorties_reussies", "Sorties", { per90: true }),
    S("buts_encaisses", "Buts encaissés", { per90: true, invert: true }),
    S("passes_reussies_pct", "% passes"),
    S("note_moyenne", "Note"),
  ],
  DEF: [
    S("tacles", "Tacles", { per90: true }),
    S("interceptions", "Interceptions", { per90: true }),
    S("actions_defensives", "Actions déf.", { per90: true }),
    S("duels_gagnes_pct", "% duels"),
    S("duels_aeriens_pct", "% aériens"),
    S("passes_reussies_pct", "% passes"),
    S("dribbles_subis", "Dribblé", { per90: true, invert: true }),
    S("note_moyenne", "Note"),
  ],
  MID: [
    S("passes_cles", "Passes clés", { per90: true }),
    S("passes_reussies_pct", "% passes"),
    S("passes_longues_pct", "% longues"),
    S("dribbles_reussis", "Dribbles", { per90: true }),
    S("interceptions", "Interceptions", { per90: true }),
    S("recuperations", "Récup.", { per90: true }),
    S("ga", "Buts+Passes", { per90: true, derived: p => (p.buts || 0) + (p.passes_decisives || 0) }),
    S("note_moyenne", "Note"),
  ],
  ATT: [
    S("buts", "Buts", { per90: true }),
    S("xg", "xG", { per90: true }),
    S("xg_hors_penalty", "npxG", { per90: true }),
    S("passes_decisives", "Passes déc.", { per90: true }),
    S("tirs", "Tirs", { per90: true }),
    S("dribbles_reussis", "Dribbles", { per90: true }),
    S("touches_surface_adverse", "Touches surf.", { per90: true }),
    S("note_moyenne", "Note"),
  ],
};

// ── Catalogue de comparaison détaillée (tableau stat-par-stat) ────────────────
// pct = pourcentage (jamais normalisé /90). invert = plus c'est bas, mieux c'est.
const C = (key, label, { per90 = false, pct = false, invert = false, derived = null } = {}) =>
  ({ key, label, per90, pct, invert, derived });

export const COMPARE_GROUPS = [
  { key: "Général", stats: [
    C("note_moyenne", "Note moyenne"),
    C("matchs_joues", "Matchs"),
    C("minutes_jouees", "Minutes"),
  ]},
  { key: "Tir", stats: [
    C("buts", "Buts", { per90: true }),
    C("xg", "xG", { per90: true }),
    C("xgot", "xG cadré", { per90: true }),
    C("xg_hors_penalty", "xG hors penaltys", { per90: true }),
    C("tirs", "Tirs", { per90: true }),
    C("tirs_cadres", "Tirs cadrés", { per90: true }),
    C("tirs_cadres_pct", "% tirs cadrés", { pct: true }),
  ]},
  { key: "Passes", stats: [
    C("passes_decisives", "Passes décisives", { per90: true }),
    C("xa", "xA", { per90: true }),
    C("passes_cles", "Passes clés", { per90: true }),
    C("grandes_chances", "Grosses occasions", { per90: true }),
    C("passes_reussies", "Passes réussies", { per90: true }),
    C("passes_reussies_pct", "% passes réussies", { pct: true }),
    C("passes_longues", "Passes longues", { per90: true }),
    C("passes_longues_pct", "% passes longues", { pct: true }),
    C("centres", "Centres", { per90: true }),
    C("centres_reussis_pct", "% centres", { pct: true }),
  ]},
  { key: "Possession", stats: [
    C("touches_balle", "Touches", { per90: true }),
    C("touches_surface_adverse", "Touches surf. adv.", { per90: true }),
    C("dribbles_reussis", "Dribbles réussis", { per90: true }),
    C("dribbles_pct", "% dribbles", { pct: true }),
    C("duels_gagnes", "Duels gagnés", { per90: true }),
    C("duels_gagnes_pct", "% duels", { pct: true }),
    C("duels_aeriens_pct", "% duels aériens", { pct: true }),
    C("pertes_balle", "Ballons perdus", { per90: true, invert: true }),
  ]},
  { key: "Défense", stats: [
    C("actions_defensives", "Actions défensives", { per90: true }),
    C("tacles", "Tacles", { per90: true }),
    C("interceptions", "Interceptions", { per90: true }),
    C("recuperations", "Récupérations", { per90: true }),
    C("degagements", "Dégagements", { per90: true }),
    C("dribbles_subis", "Dribblé (subi)", { per90: true, invert: true }),
    C("buts_encaisses_terrain", "Buts encaissés (terrain)", { per90: true, invert: true }),
    C("xg_concede_terrain", "xG concédés (terrain)", { per90: true, invert: true }),
  ]},
  { key: "Discipline", stats: [
    C("fautes_subies", "Fautes subies", { per90: true }),
    C("fautes_commises", "Fautes commises", { per90: true, invert: true }),
    C("cartons_jaunes", "Cartons jaunes", { per90: true, invert: true }),
    C("cartons_rouges", "Cartons rouges", { per90: true, invert: true }),
  ]},
  { key: "Gardien", stats: [
    C("arrets", "Arrêts", { per90: true }),
    C("arrets_pct", "% arrêts", { pct: true }),
    C("clean_sheets", "Clean sheets", { per90: true }),
    C("sorties_reussies", "Sorties", { per90: true }),
    C("buts_encaisses", "Buts encaissés", { per90: true, invert: true }),
  ]},
];

// Valeur d'une stat pour le tableau comparatif (per-90 optionnel via per90On).
export function compareValue(player, stat, per90On = true) {
  const raw = stat.derived ? stat.derived(player) : player[stat.key];
  if (raw == null || raw === "" || isNaN(Number(raw))) return null;
  const n = Number(raw);
  if (stat.pct || !stat.per90 || !per90On) return n;
  const min = Number(player.minutes_jouees);
  if (!min || min < 90) return n;                  // pas assez de minutes → brut
  return Math.round((n / min) * 90 * 100) / 100;
}

// Mise en forme lisible d'une valeur de stat.
export function formatStat(value, stat) {
  if (value == null) return "—";
  if (stat.pct) return `${value}%`;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function groupOf(poste) {
  return POSITION_GROUP[poste] || "ATT";
}

// Valeur brute d'une stat (gère les champs dérivés)
function rawValue(player, stat) {
  if (stat.derived) return stat.derived(player);
  const v = player[stat.key];
  return v == null || v === "" ? null : Number(v);
}

// Valeur normalisée per-90 si pertinent (sinon valeur brute)
function statValue(player, stat) {
  const raw = rawValue(player, stat);
  if (raw == null || isNaN(raw)) return null;
  if (!stat.per90) return raw;
  const min = Number(player.minutes_jouees);
  if (!min || min < 90) return raw; // pas assez de minutes pour normaliser → brut
  return Math.round((raw / min) * 90 * 100) / 100;
}

// Percentile d'une valeur dans un échantillon de nombres (0-100)
function percentile(value, sample) {
  if (!sample.length) return null;
  const below = sample.filter(v => v <= value).length;
  return Math.round((below / sample.length) * 100);
}

/**
 * Construit les données radar par percentiles.
 * @param comparePlayers  joueurs affichés (référence + sélectionnés)
 * @param pool            vivier complet (tous les joueurs de l'agent)
 * @param poste           poste de référence (détermine les axes)
 * @returns { data, mode }  data = [{ attribute, [nomJoueur]: 0-100 }], mode = "percentile" | "relatif"
 */
export function buildPerformanceRadar(comparePlayers, pool, poste) {
  const stats = RADAR_STATS[groupOf(poste)] || RADAR_STATS.ATT;

  // Vivier du même groupe de poste (fallback : tout le vivier)
  const grp = groupOf(poste);
  let cohort = (pool || []).filter(p => groupOf(p.poste) === grp);
  if (cohort.length < 6) cohort = pool || [];

  // Pour chaque stat, ne garder l'axe que si la référence + ≥1 comparé ont une valeur
  const data = [];
  for (const stat of stats) {
    const compareVals = comparePlayers.map(p => statValue(p, stat));
    const refHas = compareVals[0] != null;
    const othersHave = compareVals.slice(1).some(v => v != null);
    if (!refHas && !othersHave) continue;

    // Échantillon du vivier pour cette stat
    const sample = cohort.map(p => statValue(p, stat)).filter(v => v != null);
    const usePercentile = sample.length >= 6;

    const max = Math.max(...compareVals.filter(v => v != null), 0) || 1;

    const row = { attribute: stat.label };
    comparePlayers.forEach(p => {
      const v = statValue(p, stat);
      if (v == null) { row[p.nom] = 0; return; }
      let score;
      if (usePercentile) {
        score = percentile(v, sample);
        if (stat.invert) score = 100 - score;
      } else {
        // Mode relatif : normalisé au max des joueurs comparés
        score = Math.round((v / max) * 100);
        if (stat.invert) score = 100 - score;
      }
      row[p.nom] = Math.max(0, Math.min(100, score));
    });
    data.push(row);
  }

  const anyPercentile = (pool || []).filter(p => groupOf(p.poste) === grp).length >= 6;
  return { data, mode: anyPercentile ? "percentile" : "relatif" };
}
