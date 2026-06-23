/**
 * Profils fiscaux par pays pour le Simulateur de transfert (ProPulse).
 *
 * ⚠️ IMPORTANT : ces taux sont des ESTIMATIONS EFFECTIVES simplifiées (impôt sur le
 * revenu + cotisations salariales pour un haut revenu sportif), destinées à faire
 * tourner le simulateur. Ce ne sont PAS des taux officiels et ils ignorent les
 * régimes spéciaux (loi Beckham ES, ruling 30% NL, impatriés IT, etc.).
 * À affiner avec de vrais barèmes par année et à valider par un fiscaliste.
 *
 * - tauxSalarie  : part retenue sur le brut côté joueur (effectif)  → net = brut × (1 − tauxSalarie)
 * - tauxPatronal : charges patronales payées EN PLUS par le club    → coût club = brut × (1 + tauxPatronal)
 */

export const TAX_YEAR_DEFAULT = 2026;
export const ANNEES_FISCALES = [2025, 2026];

// Pays de départ : BE / NL / FR + ES / GB / IT / DE / AT
const PROFILS_2026 = {
  BE: { nom: "Belgique",        drapeau: "🇧🇪", tauxSalarie: 0.47, tauxPatronal: 0.25 },
  NL: { nom: "Pays-Bas",        drapeau: "🇳🇱", tauxSalarie: 0.42, tauxPatronal: 0.20 },
  FR: { nom: "France",          drapeau: "🇫🇷", tauxSalarie: 0.45, tauxPatronal: 0.35 },
  ES: { nom: "Espagne",         drapeau: "🇪🇸", tauxSalarie: 0.45, tauxPatronal: 0.30 },
  GB: { nom: "Angleterre (UK)", drapeau: "🇬🇧", tauxSalarie: 0.46, tauxPatronal: 0.15 },
  IT: { nom: "Italie",          drapeau: "🇮🇹", tauxSalarie: 0.46, tauxPatronal: 0.30 },
  DE: { nom: "Allemagne",       drapeau: "🇩🇪", tauxSalarie: 0.45, tauxPatronal: 0.20 },
  AT: { nom: "Autriche",        drapeau: "🇦🇹", tauxSalarie: 0.48, tauxPatronal: 0.21 },
};

// Table paramétrable par année (mêmes valeurs de départ pour 2025/2026, à ajuster).
export const TAX_PROFILES = {
  2025: PROFILS_2026,
  2026: PROFILS_2026,
};

export const PAYS_CODES = Object.keys(PROFILS_2026);

/** Retourne le profil fiscal d'un pays pour une année (fallback année par défaut). */
export function getTaxProfile(code, year = TAX_YEAR_DEFAULT) {
  const table = TAX_PROFILES[year] || TAX_PROFILES[TAX_YEAR_DEFAULT];
  return table[code] || null;
}
