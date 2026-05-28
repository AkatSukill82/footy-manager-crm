export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

const PLAYER_NUM = new Set([
  'age','valeur_marchande','valeur_marchande_peak','taille','poids',
  'salaire','salaire_semaine','numero_maillot',
  'matchs_joues','titularisations','minutes_jouees',
  'buts','passes_decisives','buts_passes',
  'cartons_jaunes','cartons_rouges','note_moyenne',
  'xg','xa','xg_par_90',
  'tirs','tirs_cadres','tirs_cadres_pct',
  'grandes_chances','grandes_chances_manquees',
  'passes_reussies','passes_reussies_pct','passes_longues_pct','passes_cles',
  'dribbles_reussis','dribbles_tentes','dribbles_pct',
  'duels_gagnes_pct','duels_aeriens_pct',
  'interceptions','tacles','tacles_reussis_pct','degagements',
  'fautes_commises','fautes_subies','hors_jeu',
  'arrets','arrets_pct','buts_encaisses','clean_sheets',
  'penaltys_marques','penaltys_tires',
  'buts_tete','buts_pied_gauche','buts_pied_droit',
  'blessures','jours_blesses',
  'matchs_carriere','buts_carriere','passes_carriere',
  'nb_clubs','saisons_pro',
  'matchs_international','buts_international','passes_international',
  'note_globale_scout','note_technique','note_physique',
  'note_intelligence','note_mental','note_attitude',
]);

/**
 * Nettoie un objet avant Player.create / Player.update :
 * - Supprime les champs null / vides
 * - Convertit les strings en nombres pour tous les champs numériques connus
 */
export function sanitizePlayerData(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (key.startsWith('_')) continue;
    if (val == null || val === '') continue;
    if (PLAYER_NUM.has(key)) {
      const n = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.').replace(/[^\d.-]/g, ''));
      if (!isNaN(n)) out[key] = n;
    } else {
      out[key] = val;
    }
  }
  return out;
}