/**
 * Profils fiscaux par pays pour le Simulateur de transfert (ProPulse).
 *
 * ⚠️ IMPORTANT : ces taux sont des ESTIMATIONS EFFECTIVES simplifiées (impôt sur le
 * revenu + cotisations salariales pour un sportif), destinées à faire tourner le
 * simulateur. Ce ne sont PAS des taux officiels et ils ignorent les barèmes réels
 * (tranches, plafonds, crédits d'impôt). À affiner et valider par un fiscaliste.
 *
 * Modèle DEUX PALIERS (cahier des charges ProPulse §5.2) :
 *   - petit  : taux effectif salarié pour un salaire SOUS le seuil "gros salaire"
 *   - gros   : taux effectif salarié AU-DESSUS du seuil
 *   - tauxPatronal : charges patronales payées EN PLUS par le club
 *
 * Net joueur = brut × (1 − tauxSalarie) ; coût club = brut × (1 + tauxPatronal).
 */

export const TAX_YEAR_DEFAULT = 2026;
export const ANNEES_FISCALES = [2025, 2026];

// Seuil (brut annuel) au-delà duquel on applique le taux "gros salaire". Estimation
// paramétrable — les hauts revenus sportifs basculent vite sur la tranche haute.
export const SEUIL_GROS_SALAIRE = 1_000_000;

// Tables 2 paliers (taux effectif salarié) — cahier ProPulse §5.2.
const PALIERS_2026 = {
  BE: { nom: "Belgique",        drapeau: "🇧🇪", petit: 0.40, gros: 0.58, tauxPatronal: 0.25 },
  NL: { nom: "Pays-Bas",        drapeau: "🇳🇱", petit: 0.34, gros: 0.50, tauxPatronal: 0.20 },
  FR: { nom: "France",          drapeau: "🇫🇷", petit: 0.35, gros: 0.53, tauxPatronal: 0.35 },
  PT: { nom: "Portugal",        drapeau: "🇵🇹", petit: 0.38, gros: 0.58, tauxPatronal: 0.2375 },
  AT: { nom: "Autriche",        drapeau: "🇦🇹", petit: 0.35, gros: 0.52, tauxPatronal: 0.21 },
  GB: { nom: "Angleterre (UK)", drapeau: "🇬🇧", petit: 0.30, gros: 0.48, tauxPatronal: 0.15 },
  DE: { nom: "Allemagne",       drapeau: "🇩🇪", petit: 0.40, gros: 0.49, tauxPatronal: 0.20 },
  IT: { nom: "Italie",          drapeau: "🇮🇹", petit: 0.33, gros: 0.50, tauxPatronal: 0.30 },
  ES: { nom: "Espagne",         drapeau: "🇪🇸", petit: 0.35, gros: 0.50, tauxPatronal: 0.30 },
};

// Table paramétrable par année (mêmes valeurs de départ, à ajuster chaque saison).
export const PALIERS = { 2025: PALIERS_2026, 2026: PALIERS_2026 };

export const PAYS_CODES = Object.keys(PALIERS_2026);

// Régimes fiscaux SPÉCIAUX (impatriés / sportifs / non-résident) — taux effectifs
// réduits, AUSSI en 2 paliers. ⚠️ Estimations pédagogiques, conditions à vérifier.
const REGIMES = {
  NL: [{ id: "ruling30", nom: "Ruling 30% (impatrié)",     petit: 0.26, gros: 0.38 }],
  FR: [{ id: "impatrie", nom: "Régime impatriés",           petit: 0.30, gros: 0.43 }],
  IT: [{ id: "impatrie", nom: "Régime impatriés (−50%)",    petit: 0.23, gros: 0.33 }],
  ES: [{ id: "nonres",   nom: "Non-résident (court terme)", petit: 0.24, gros: 0.24 }],
};

/** Régimes spéciaux disponibles pour un pays (peut être vide). */
export function getRegimes(code) {
  // Expose aussi `tauxSalarie` (= palier gros) pour compat ascendante.
  return (REGIMES[code] || []).map((r) => ({ ...r, tauxSalarie: r.gros }));
}

// Abattement "jeune joueur" (< 23 ans) : réduction RELATIVE du taux effectif.
export const AGE_SEUIL_JEUNE = 23;
export const ABATTEMENT_MOINS_23 = 0.10; // -10 % sur le taux effectif

// Options de saisie (cahier §5.1).
export const RESIDENCE_OPTIONS = [
  { id: "resident",     nom: "Résident fiscal" },
  { id: "non_resident", nom: "Non-résident" },
];
export const SITUATION_OPTIONS = [
  { id: "single",  nom: "Célibataire" },
  { id: "married", nom: "Marié(e)" },
];

/**
 * Profil "legacy" d'un pays (compat ascendante) : renvoie un objet avec
 * `tauxSalarie` (= palier gros) + `tauxPatronal`. Utilisé par ScenarioComparator.
 */
export function getTaxProfile(code, year = TAX_YEAR_DEFAULT) {
  const table = PALIERS[year] || PALIERS[TAX_YEAR_DEFAULT];
  const p = table[code];
  if (!p) return null;
  return { nom: p.nom, drapeau: p.drapeau, tauxSalarie: p.gros, tauxPatronal: p.tauxPatronal, petit: p.petit, gros: p.gros };
}

/** Applique l'abattement « moins de 23 ans » au taux effectif salarié. */
export function tauxSalarieAjuste(tauxBase, age) {
  if (age != null && age < AGE_SEUIL_JEUNE) return tauxBase * (1 - ABATTEMENT_MOINS_23);
  return tauxBase;
}

// ── Ajustements famille / résidence (cahier §5.3, V1 prudente) ─────────────────
// Effet exprimé en POINTS de taux (soustraits du taux effectif), uniquement pour
// un résident. Plafonné pour éviter une estimation trop optimiste.
const ADJ_MARIE = 0.02;          // -2 pts
const ADJ_PAR_ENFANT = 0.01;     // -1 pt / enfant
const ADJ_ENFANTS_MAX = 0.03;    // plafond enfants -3 pts
const ADJ_FAMILLE_MAX = 0.05;    // plafond global -5 pts

export function ajustementFamilial({ residency = "resident", marital = "single", children = 0 } = {}) {
  if (residency === "non_resident") return 0; // pas d'abattement résident
  let adj = 0;
  if (marital === "married") adj += ADJ_MARIE;
  adj += Math.min(ADJ_ENFANTS_MAX, (Number(children) || 0) * ADJ_PAR_ENFANT);
  return Math.min(ADJ_FAMILLE_MAX, adj);
}

/**
 * Moteur fiscal joueur (cahier §5). Choisit le palier petit/gros selon le brut,
 * applique le régime spécial s'il est sélectionné, puis les ajustements
 * famille/résidence et l'abattement jeune (< 23 ans).
 *
 * @returns { tauxSalarie, tauxPatronal, tier, regimeApplied, familyAdjust, profil }
 */
export function estimerTauxSalarie({
  code, year = TAX_YEAR_DEFAULT, grossAnnual = 0,
  residency = "resident", marital = "single", children = 0,
  regime = "", age = null,
}) {
  const table = PALIERS[year] || PALIERS[TAX_YEAR_DEFAULT];
  const profil = table[code];
  if (!profil) return { tauxSalarie: 0.45, tauxPatronal: 0.30, tier: "gros", regimeApplied: null, familyAdjust: 0, profil: null };

  const gros = (Number(grossAnnual) || 0) >= SEUIL_GROS_SALAIRE;
  const palier = gros ? "gros" : "petit";

  const regimeObj = (REGIMES[code] || []).find((r) => r.id === regime) || null;
  let taux = regimeObj ? regimeObj[palier] : profil[palier];

  // Ajustements famille (pas cumulés avec un régime non-résident qui les exclut déjà).
  const familyAdjust = ajustementFamilial({ residency, marital, children });
  taux = Math.max(0.05, taux - familyAdjust);

  // Abattement jeune (<23 ans), uniquement en l'absence de régime spécial.
  if (!regimeObj) taux = tauxSalarieAjuste(taux, age);

  return {
    tauxSalarie: taux,
    tauxPatronal: profil.tauxPatronal,
    tier: palier,
    regimeApplied: regimeObj ? regimeObj.nom : null,
    familyAdjust,
    profil,
  };
}
