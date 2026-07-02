/**
 * Analyse de scouting FotMob — logique pure (fr/en/es), sans effet de bord.
 * S'appuie sur les 4 familles de percentiles FotMob (tir / passe / possession /
 * défense, 0..100 « vs joueurs du même poste ») + quelques stats clés pour
 * produire une appréciation en phrases et le détail par famille.
 */

// Les 4 familles comparées (ordre d'affichage), clés du proxy FotMob.
export const FOTMOB_FAMILIES = ["shooting", "passing", "possession", "defending"];

export const FAMILY_LABEL = {
  fr: { shooting: "Tir", passing: "Passe", possession: "Possession", defending: "Défense" },
  en: { shooting: "Shooting", passing: "Passing", possession: "Possession", defending: "Defending" },
  es: { shooting: "Tiro", passing: "Pase", possession: "Posesión", defending: "Defensa" },
};

// Stats détaillées par famille — mêmes clés que PlayerFotmobStats (libellés via
// i18n `session.fotmob.l.<clé>`), pour un rendu cohérent avec la fiche joueur.
export const FAMILY_STATS = {
  shooting:   ["buts", "xg", "xgot", "xg_hors_penalty", "tirs", "tirs_cadres"],
  passing:    ["passes_decisives", "xa", "passes_reussies", "passes_reussies_pct", "passes_longues", "passes_longues_pct", "passes_cles", "grandes_chances", "centres", "centres_reussis_pct"],
  possession: ["duels_gagnes", "duels_gagnes_pct", "touches_balle", "touches_surface_adverse", "pertes_balle", "fautes_subies"],
  defending:  ["actions_defensives", "interceptions", "tacles", "recuperations", "dribbles_subis", "degagements", "buts_encaisses_terrain", "xg_concede_terrain"],
};

export const FAMILY_STAT_SUFFIX = { passes_reussies_pct: "%", passes_longues_pct: "%", centres_reussis_pct: "%", duels_gagnes_pct: "%" };

// Couleur d'un percentile (barres du diagramme).
export const pctColor = (v) =>
  v >= 70 ? "#16a34a" : v >= 55 ? "#65a30d" : v >= 45 ? "#f59e0b" : v >= 30 ? "#f97316" : "#ef4444";

const TXT = {
  fr: { strong: "Points forts", avg: "Dans la moyenne", watch: "Point de vigilance", rating: "Note FotMob moyenne",
        off: "Profil offensif", crea: "Profil créateur", poss: "Profil de possession", def: "Profil défensif", bal: "Profil équilibré", pct: "e pct" },
  en: { strong: "Strengths", avg: "Around average", watch: "Watch-out", rating: "Average FotMob rating",
        off: "Attacking profile", crea: "Creative profile", poss: "Possession profile", def: "Defensive profile", bal: "Balanced profile", pct: "th pct" },
  es: { strong: "Puntos fuertes", avg: "En la media", watch: "Punto de atención", rating: "Nota media FotMob",
        off: "Perfil ofensivo", crea: "Perfil creador", poss: "Perfil de posesión", def: "Perfil defensivo", bal: "Perfil equilibrado", pct: "º pct" },
};

/**
 * Génère une appréciation en phrases depuis les 4 percentiles (+ note moyenne).
 * Renvoie `null` si aucune donnée comparative FotMob n'est disponible.
 * @returns {{ headline: string, sentences: string[] } | null}
 */
export function buildScoutAnalysis(percentiles = {}, stats = {}, { lang = "fr" } = {}) {
  const L = TXT[lang] || TXT.fr;
  const FL = FAMILY_LABEL[lang] || FAMILY_LABEL.fr;
  const entries = FOTMOB_FAMILIES
    .map((k) => ({ k, v: Number(percentiles?.[k]) }))
    .filter((e) => Number.isFinite(e.v));
  if (!entries.length) return null;

  const sorted = [...entries].sort((a, b) => b.v - a.v);
  const top = sorted[0], low = sorted[sorted.length - 1];
  const fmt = (e) => `${FL[e.k]} (${Math.round(e.v)}${L.pct})`;

  const strengths = sorted.filter((e) => e.v >= 55);
  const mids = sorted.filter((e) => e.v >= 40 && e.v < 55);
  const watch = sorted.filter((e) => e.v < 40);

  const profileByFamily = { shooting: L.off, passing: L.crea, possession: L.poss, defending: L.def };
  const headline = (top.v - low.v) <= 15 ? L.bal : (profileByFamily[top.k] || L.bal);

  const sentences = [];
  sentences.push(`${headline} — ${L.strong.toLowerCase()} : ${(strengths.length ? strengths : [top]).map(fmt).join(", ")}.`);
  if (mids.length) sentences.push(`${L.avg} : ${mids.map(fmt).join(", ")}.`);
  if (watch.length) sentences.push(`${L.watch} : ${watch.map(fmt).join(", ")}.`);

  const rating = Number(stats?.note_moyenne);
  if (Number.isFinite(rating) && rating > 0) sentences.push(`${L.rating} : ${rating}.`);

  return { headline, sentences };
}
