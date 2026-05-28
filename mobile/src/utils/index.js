export const formatCurrency = (value, decimals = 1) => {
  if (!value && value !== 0) return '—';
  return `${Number(value).toFixed(decimals)}M €`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  } catch {
    return dateStr;
  }
};

export const getPositionColor = (position) => {
  const colors = {
    'Gardien': '#f59e0b',
    'GK': '#f59e0b',
    'Défenseur': '#3b82f6',
    'DC': '#3b82f6', 'DD': '#3b82f6', 'DG': '#3b82f6',
    'Milieu': '#22c55e',
    'MC': '#22c55e', 'MO': '#22c55e', 'MD': '#22c55e', 'MG': '#22c55e',
    'Attaquant': '#ef4444',
    'AIG': '#ef4444', 'AID': '#ef4444', 'BU': '#ef4444',
  };
  return colors[position] || '#64748b';
};

export const getStatusColor = (status) => {
  const colors = {
    'actif': '#22c55e',
    'blessé': '#ef4444',
    'suspendu': '#f59e0b',
    'prêté': '#8b5cf6',
    'transfert': '#3b82f6',
  };
  return colors[status?.toLowerCase()] || '#64748b';
};

export const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const truncate = (str, len = 25) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '…' : str;
};

// Champs numériques de l'entité Player
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

// Corrections de noms de champs (IA → entité Player)
const PLAYER_REMAP = {
  buts_saison:       'buts',
  passes_saison:     'passes_decisives',
  date_fin_contrat:  'contrat_fin',
};

/**
 * Nettoie un objet avant de le sauvegarder comme Player.
 * - Renomme les champs mal nommés (ex: buts_saison → buts)
 * - Convertit les strings en nombres pour les champs numériques
 * - Supprime les champs internes (_searchId etc.)
 */
export const sanitizePlayerData = (data) => {
  if (!data || typeof data !== 'object') return {};
  const out = {};
  for (const [key, val] of Object.entries(data)) {
    if (key.startsWith('_')) continue;
    const k = PLAYER_REMAP[key] || key;
    if (val == null || val === '') continue;
    if (PLAYER_NUM.has(k)) {
      const n = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.').replace(/[^\d.-]/g, ''));
      if (!isNaN(n)) out[k] = n;
    } else {
      out[k] = val;
    }
  }
  return out;
};
