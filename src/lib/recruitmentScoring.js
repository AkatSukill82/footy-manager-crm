/**
 * Moteur du module Recrutement (ProPulse) — logique pure, sans effet de bord.
 * Tiré du cahier des charges "Module recrutement joueurs" (juin 2026).
 * Scoring majeur (§7), scoring mineur (§12), conformité feux (§13), statut CRM
 * (§7/§14/§17), génération de message (§9) et liens Transfermarkt (§4).
 */

// ── Liens Transfermarkt (§4) ────────────────────────────────────────────────
// Liens de sourcing Transfermarkt (URL canoniques vérifiées — pages /statistik/).
export const TM_LINKS = [
  { key: "goals_assists", label: "Buts + passes (G+A)", url: "https://www.transfermarkt.com/statistik/topscorer" },
  { key: "contracts_ending", label: "Fins de contrat", url: "https://www.transfermarkt.com/statistik/endendevertraege" },
  { key: "appearances", label: "Temps de jeu (matchs)", url: "https://www.transfermarkt.com/statistik/gesamteinsaetze" },
  { key: "advanced_search", label: "Recherche détaillée", url: "https://www.transfermarkt.com/detailsuche/spielerdetail/suche" },
  { key: "free_agents", label: "Joueurs libres", url: "https://www.transfermarkt.com/statistik/vertragslosespieler" },
  { key: "agencies", label: "Agences de joueurs", url: "https://www.transfermarkt.com/berater/beraterfirmenuebersicht/berater" },
];

// Postes offensifs (§17) → on utilise G+A, sinon matchs/minutes/attributs.
export const POSTES_OFFENSIFS = ["CF", "LW", "RW", "AM", "SS", "ST", "AT", "Ailier droit", "Ailier gauche", "Attaquant", "Milieu offensif"];
export const isOffensive = (poste = "") =>
  POSTES_OFFENSIFS.some((p) => String(poste).toLowerCase().includes(p.toLowerCase()));

const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(Number(v) || 0)));
// Note 0..3 avec demi-points autorisés (les familles de stats valent 0 / 1,5 / 3).
const clampNote = (v) => { const n = Number(v); return isNaN(n) ? 0 : Math.max(0, Math.min(3, Math.round(n * 2) / 2)); };

// Mois entre aujourd'hui et une date (aaaa-mm-jj). NaN si vide/invalide.
export function monthsUntil(dateStr) {
  if (!dateStr) return NaN;
  const end = new Date(dateStr), now = new Date();
  if (isNaN(end.getTime())) return NaN;
  return (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
}

// ── PERSISTANCE de la config de scoring (par ORGANISATION) ───────────────────
// Migration localStorage → Base44 : la config (barèmes, critères, seuils, profil
// cible) est partagée dans le groupe via l'entité RecruitmentConfig. Le moteur
// reste SYNCHRONE : un cache mémoire (`_store`) est hydraté au chargement par
// `hydrateConfigCache` (cf. useRecruitmentConfig) et sert de source prioritaire ;
// localStorage reste un miroir de repli hors-ligne / avant hydratation.
export const CFG_KEYS = { bands: "fdm_recruit_bands", criteria: "fdm_recruit_criteria", tiers: "fdm_recruit_tiers", target: "fdm_recruit_target" };
const _store = Object.create(null);   // clé → objet déjà parsé (prioritaire sur localStorage)

function readRaw(key) {
  if (key in _store) return _store[key];
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}
function writeRaw(key, val) {
  _store[key] = val;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}
function removeRaw(key) {
  delete _store[key];
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

// Abonnement aux changements de config → les vues (fiche joueur, formulaire)
// recalculent leur score. Pont de réactivité pour un cache hors de React.
const _subs = new Set();
export function onConfigChange(fn) { _subs.add(fn); return () => _subs.delete(fn); }
function emitChange() { for (const fn of _subs) { try { fn(); } catch { /* ignore */ } } }

// Hydrate le cache depuis la config d'organisation chargée (Base44).
export function hydrateConfigCache(cfg = {}) {
  for (const k of Object.keys(CFG_KEYS)) if (cfg && cfg[k] != null) writeRaw(CFG_KEYS[k], cfg[k]);
  emitChange();
}
// Sérialise la config courante (barèmes, critères, seuils, cible) → persistance.
export function serializeConfig() {
  const out = {};
  for (const [k, key] of Object.entries(CFG_KEYS)) out[k] = readRaw(key);
  return out;
}

// ── BARÈMES configurables des critères chiffrés (bornes des 4 paliers) ───────
// Chaque critère numérique = 3 bornes (entre les notes 3/2/1/0) + un sens :
//   dir "desc" → valeur ≤ borne donne la note haute (plus petit = mieux)
//   dir "asc"  → valeur ≥ borne donne la note haute (plus grand = mieux)
// Les valeurs par défaut reproduisent EXACTEMENT le barème historique.
// L'utilisateur peut déplacer les bornes (stockées en localStorage, par user).
export const NUMERIC_BANDS = {
  age:          { label: "Âge",              unit: "ans",            dir: "desc", step: 1,    t: [21, 23, 25] },
  contract:     { label: "Contrat",          unit: "mois restants",  dir: "desc", step: 1,    t: [12, 18, 24] },
  market:       { label: "Fit marché",       unit: "clubs cibles",   dir: "asc",  step: 1,    t: [5, 3, 2] },
  market_value: { label: "Valeur marchande", unit: "M€",             dir: "desc", step: 0.1,  t: [1, 5, 15] },
  production:   { label: "Production",       unit: "(buts+passes)/90", dir: "asc", step: 0.05, t: [0.75, 0.45, 0.20] },
};
export function getBandsConfig() {
  const saved = readRaw(CFG_KEYS.bands) || {};
  const out = {};
  for (const [k, def] of Object.entries(NUMERIC_BANDS)) {
    const t = Array.isArray(saved[k]?.t) && saved[k].t.length === 3
      ? saved[k].t.map((x) => Number(x))
      : def.t;
    out[k] = { ...def, t };
  }
  return out;
}
export function setBandsConfig(cfg) {
  const slim = {};
  for (const k of Object.keys(NUMERIC_BANDS)) if (cfg?.[k]?.t) slim[k] = { t: cfg[k].t.map((x) => Number(x)) };
  writeRaw(CFG_KEYS.bands, slim); emitChange();
}
export function resetBandsConfig() { removeRaw(CFG_KEYS.bands); emitChange(); }

// Note 0..3 d'une valeur selon une définition de bande { dir, t:[a,b,c] }.
export function noteFromBands(value, band) {
  const v = Number(value);
  if (isNaN(v) || !band || !Array.isArray(band.t)) return 0;
  const [a, b, c] = band.t.map(Number);
  if (band.dir === "asc") return v >= a ? 3 : v >= b ? 2 : v >= c ? 1 : 0;
  return v <= a ? 3 : v <= b ? 2 : v <= c ? 1 : 0; // desc
}

// ── Scoring joueur MAJEUR (§7) — critères notés 0..3 ─────────────────────────
// Chaque critère stocke directement une note 0..3 saisie/dérivée.
export const MAJOR_CRITERIA = [
  { key: "age",          label: "Âge",                hint: "barème éditable (bornes des paliers)" },
  { key: "contract",     label: "Contrat",            hint: "barème éditable (mois restants ; libre = note max)" },
  { key: "level",        label: "Niveau joué",        hint: "D4-jeunes / D3 / D2 / D1 ou D2 forte" },
  { key: "production",   label: "Production/minutes", hint: "faible / moyen / bon / élite" },
  { key: "agency",       label: "Agence",             hint: "verrouillé / grande / petite / sans agent" },
  { key: "market",       label: "Fit marché",         hint: "barème éditable (nb de clubs cibles)" },
  { key: "market_value", label: "Valeur marchande",   hint: "barème éditable (tranches en M€) — à activer" },
  { key: "fit",          label: "Fit profil cible",   hint: "adéquation au profil recherché (poste, âge, niveau, pays, pied)" },
  { key: "stat_shooting",   label: "Tir (FotMob)",        hint: "percentile FotMob ≥70=3 · 50-69=1,5 · <50=0 — à activer" },
  { key: "stat_passing",    label: "Passe (FotMob)",      hint: "percentile FotMob ≥70=3 · 50-69=1,5 · <50=0 — à activer" },
  { key: "stat_possession", label: "Possession (FotMob)", hint: "percentile FotMob ≥70=3 · 50-69=1,5 · <50=0 — à activer" },
  { key: "stat_defending",  label: "Défense (FotMob)",    hint: "percentile FotMob ≥70=3 · 50-69=1,5 · <50=0 — à activer" },
];

// Note d'âge (0..3) selon le barème configurable (défaut : 18-21=3 … 26+=0).
export function ageScore(age, bands = getBandsConfig()) {
  return noteFromBands(age, bands.age);
}
// Note de contrat (0..3) depuis les mois restants — joueur libre = note max.
export function contractScore(monthsLeft, isFree, bands = getBandsConfig()) {
  if (isFree) return 3;
  const m = Number(monthsLeft);
  if (isNaN(m)) return 0;
  return noteFromBands(m, bands.contract);
}
// Fit marché depuis le nombre de clubs cibles réalistes.
export function marketScore(nbClubs, bands = getBandsConfig()) {
  return noteFromBands(nbClubs, bands.market);
}
// Note de valeur marchande (M€) selon le barème configurable.
export function marketValueScore(valueM, bands = getBandsConfig()) {
  if (valueM == null || valueM === "") return 0;
  return noteFromBands(valueM, bands.market_value);
}

// ── Dérivation AUTOMATIQUE des notes "Niveau" et "Production" ─────────────────
// Alimentées par Transfermarkt (niveau de ligue) et par les stats fusionnées
// (production /90). Renvoient `null` quand la donnée manque → on garde alors la
// saisie manuelle. Le scout peut toujours surcharger la note proposée.

// Deuxièmes divisions « fortes » (codes compétition Transfermarkt) → notées 3
// comme une D1, car le niveau y est comparable (cf. barème "D1 ou D2 forte").
const STRONG_SECOND_TIERS = new Set(["GB2", "ES2", "IT2", "L2", "FR2", "PO2"]);

// Niveau de ligue → note 0..3 (1er niveau = 3 · 2e = 2 (ou 3 si forte) · 3e = 1 · 4e+ = 0).
export function tierToLevelNote(tier, code = "") {
  const t = Number(tier);
  if (!t || isNaN(t)) return null;          // pas de niveau connu → manuel
  if (t <= 1) return 3;
  if (t === 2) return STRONG_SECOND_TIERS.has(String(code).toUpperCase()) ? 3 : 2;
  if (t === 3) return 1;
  return 0;                                  // 4e niveau et au-delà / jeunes
}
export function deriveLevelNote({ league_tier, league_code } = {}) {
  return tierToLevelNote(league_tier, league_code);
}

// Production → note 0..3 à partir des stats saison normalisées par 90 min, selon
// le poste. Offensifs : jugés sur (buts+passes)/90. Autres : note moyenne
// (SofaScore) prioritaire, sinon contribution + régularité. Petit échantillon
// (peu de minutes) → note plafonnée par prudence.
export function deriveProductionNote(stats = {}, poste = "", bands = getBandsConfig()) {
  const s = stats || {};
  const goals   = Number(s.buts ?? s.goals) || 0;
  const assists = Number(s.passes_decisives ?? s.assists) || 0;
  const matches = Number(s.matchs_joues ?? s.matches) || 0;
  const rating  = Number(s.note_moyenne) || 0;
  const minutes = (Number(s.minutes_jouees ?? s.minutes) || 0) || matches * 72;
  if (minutes < 270) return null;            // < ~3 matchs : échantillon insuffisant → manuel

  const ga90 = (goals + assists) * 90 / minutes;
  let note;
  if (isOffensive(poste)) {
    note = noteFromBands(ga90, bands.production);  // seuils (buts+passes)/90 configurables
    if (rating >= 7.4 && note < 3) note += 1;     // surperformance confirmée par la note
    if (rating && rating < 6.6 && note > 0) note -= 1;
  } else if (rating >= 6.8) {
    note = rating >= 7.3 ? 3 : rating >= 7.05 ? 2 : 1;   // milieux/déf/GK : note moyenne d'abord
  } else {
    note = ga90 >= 0.35 ? 2 : ga90 >= 0.15 ? 1 : minutes >= 1500 ? 1 : 0;
  }
  if (minutes < 720 && note > 2) note = 2;     // < ~8 matchs : prudence
  return Math.max(0, Math.min(3, note));
}

// ── Familles de stats FotMob (percentile par famille) → notes 0 / 1,5 / 3 ─────
// Règle : on part du percentile moyen de la famille. ≥70 → 3 (top tiers),
// 50-69 → 1,5 (moyen), <50 → 0. (= ton 0 / 0,5 / 1 ramené sur l'échelle /3.)
export function percentileToNote(avgPercentile) {
  const a = Number(avgPercentile);
  if (isNaN(a)) return null;                   // pas de donnée FotMob → non noté
  return a >= 70 ? 3 : a >= 50 ? 1.5 : 0;
}
// Mappe les percentiles moyens par famille → notes des 4 critères stat_*.
export function statFamilyNotes(percentiles = {}) {
  const p = percentiles || {};
  return {
    stat_shooting:   percentileToNote(p.shooting),
    stat_passing:    percentileToNote(p.passing),
    stat_possession: percentileToNote(p.possession),
    stat_defending:  percentileToNote(p.defending),
  };
}

// ── Adéquation au PROFIL CIBLE (§ profil cible) → note 0..3 ───────────────────
// Compare uniquement les champs renseignés du profil cible aux données du
// joueur ; la note reflète la PART de critères respectés. Renvoie `null` quand
// aucun profil cible n'est défini (le critère "fit" est alors désactivé).
export function fitScore(player = {}, target = getTargetProfile()) {
  const inc = (a, b) => !!a && !!b && String(a).toLowerCase().includes(String(b).toLowerCase());
  const posMatch = (a, b) => {
    const toksOf = (s) => String(s || "").toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length >= 2);
    const A = toksOf(a), B = toksOf(b);
    return A.some((x) => B.includes(x));
  };
  const checks = [];
  if (target.poste) checks.push(posMatch(player.positions, target.poste));
  if (target.ageMin || target.ageMax) {
    const age = Number(player.age);
    const lo = Number(target.ageMin) || 0, hi = Number(target.ageMax) || 99;
    checks.push(!!age && age >= lo && age <= hi);
  }
  if (target.niveau) checks.push(inc(player.division, target.niveau) || inc(target.niveau, player.division));
  if (target.pays)   checks.push(inc(player.country, target.pays) || inc(target.pays, player.country));
  if (target.pied)   checks.push(inc(player.pied, target.pied) || inc(target.pied, player.pied));
  if (!checks.length) return null;            // aucun profil cible → non noté
  const ratio = checks.filter(Boolean).length / checks.length;
  return ratio >= 0.8 ? 3 : ratio >= 0.55 ? 2 : ratio >= 0.3 ? 1 : 0;
}

// Scoring pondéré : ne compte que les critères ACTIVÉS, chacun × son poids.
// Renvoie aussi `max` (dynamique) car il dépend des critères actifs et des poids.
export function scoreMajor(notes = {}, config = getCriteriaConfig()) {
  const active = config.filter((c) => c.enabled);
  const breakdown = active.map((c) => ({
    key: c.key, label: c.label, weight: c.weight, custom: !!c.custom,
    note: clampNote(notes[c.key]),
  }));
  const total = breakdown.reduce((s, b) => s + b.note * b.weight, 0);
  const max = active.reduce((s, c) => s + 3 * c.weight, 0) || 1;
  return { total, max, breakdown };
}

// ── Critères CONFIGURABLES : activer/désactiver, pondérer, ajouter (par org) ──
export function getCriteriaConfig() {
  const saved = readRaw(CFG_KEYS.criteria) || {};
  const ov = saved.base || {};
  // Le critère "fit" n'a de sens qu'avec un profil cible : sinon on le désactive
  // (et il ne compte donc pas dans le score ni dans le max).
  const tp = getTargetProfile();
  const hasTarget = !!(tp.poste || tp.ageMin || tp.ageMax || tp.niveau || tp.pays || tp.pied);
  // Par défaut, le score ne note QUE des infos du joueur + ses stats :
  // âge, contrat, niveau, production, valeur marchande. "Agence" et "Fit marché"
  // (nb de clubs) ne sont pas des données du joueur → désactivés par défaut
  // (réactivables). "Fit profil cible" reste conditionné à un profil défini.
  const OPT_IN = new Set(["agency", "market", "stat_shooting", "stat_passing", "stat_possession", "stat_defending"]);
  const base = MAJOR_CRITERIA.map((c) => ({
    key: c.key, label: c.label, hint: c.hint, custom: false,
    enabled: c.key === "fit"
      ? (hasTarget && ov.fit?.enabled !== false)           // fit : seulement si profil cible défini
      : OPT_IN.has(c.key)
      ? (ov[c.key]?.enabled === true)                      // agence / fit marché : désactivés par défaut
      : (ov[c.key]?.enabled !== false),                    // joueur + stats : activés par défaut
    weight: clampInt(ov[c.key]?.weight ?? 1, 1, 5),
  }));
  const custom = Array.isArray(saved.custom) ? saved.custom.map((c) => ({
    key: c.key, label: c.label || "Critère", hint: c.hint || "Faible / Moyen / Bon / Excellent",
    custom: true, enabled: c.enabled !== false, weight: clampInt(c.weight ?? 1, 1, 5),
  })) : [];
  return [...base, ...custom];
}
export function setCriteriaConfig(list) {
  const base = {}, custom = [];
  for (const c of (list || [])) {
    if (c.custom) custom.push({ key: c.key, label: c.label, hint: c.hint, enabled: !!c.enabled, weight: clampInt(c.weight, 1, 5) });
    else base[c.key] = { enabled: !!c.enabled, weight: clampInt(c.weight, 1, 5) };
  }
  writeRaw(CFG_KEYS.criteria, { base, custom }); emitChange();
}
export function resetCriteriaConfig() { removeRaw(CFG_KEYS.criteria); emitChange(); }
export function currentScoreMax(config = getCriteriaConfig()) {
  return config.filter((c) => c.enabled).reduce((s, c) => s + 3 * c.weight, 0) || 18;
}

// ── Profil cible de recherche (par org) ──────────────────────────────────────
const DEFAULT_TARGET = { poste: "", ageMin: "", ageMax: "", niveau: "", pays: "", pied: "" };
export function getTargetProfile() {
  return { ...DEFAULT_TARGET, ...(readRaw(CFG_KEYS.target) || {}) };
}
export function setTargetProfile(t) { writeRaw(CFG_KEYS.target, { ...DEFAULT_TARGET, ...t }); emitChange(); }
export function resetTargetProfile() { removeRaw(CFG_KEYS.target); emitChange(); }

// ── Seuils de décision CONFIGURABLES (§8/§19 : critères pas figés) ───────────
// Le score reste /18 (6 critères × 3). Les seuils sont éditables et stockés en
// localStorage → scoreTier/deriveStatus s'y réfèrent automatiquement.
export const SCORE_MAX = MAJOR_CRITERIA.length * 3; // 18
const DEFAULT_TIERS = { priority: 16, contact: 13, watch: 9 };

export function getTiers() {
  const max = currentScoreMax();
  const t = { ...DEFAULT_TIERS, ...(readRaw(CFG_KEYS.tiers) || {}) };
  // garde-fou : borné au max courant (dépend des critères actifs + poids)
  return {
    priority: clampInt(t.priority, 1, max),
    contact:  clampInt(t.contact, 1, max),
    watch:    clampInt(t.watch, 0, max),
  };
}
export function setTiers(t) { writeRaw(CFG_KEYS.tiers, t); emitChange(); }
export function resetTiers() { removeRaw(CFG_KEYS.tiers); emitChange(); }

// Libellé "tier" du score final (§7) — seuils configurables.
export function scoreTier(total, tiers = getTiers()) {
  if (total >= tiers.priority) return { key: "priority", label: "Priorité A", color: "green" };
  if (total >= tiers.contact)  return { key: "contact",  label: "Contact (après validation)", color: "blue" };
  if (total >= tiers.watch)    return { key: "watch",    label: "Observation / watchlist", color: "amber" };
  return { key: "abandon", label: "Abandon", color: "slate" };
}

// ── SCORING UNIFIÉ depuis une fiche joueur stockée ───────────────────────────
// Réutilise EXACTEMENT le moteur (mêmes barèmes, critères, seuils) que le
// formulaire de recrutement, mais alimenté par les seules données présentes sur
// la fiche. Renvoie `null` pour un critère non calculable → il est IGNORÉ (et
// non noté 0), pour ne pas pénaliser une fiche incomplète.
export function notesFromPlayer(player = {}, { target = getTargetProfile(), bands = getBandsConfig() } = {}) {
  const p = player || {};
  const age = p.age != null && p.age !== "" ? Number(p.age) : null;
  const poste = p.poste || p.position || "";
  const stats = {
    buts: p.buts, passes_decisives: p.passes_decisives,
    matchs_joues: p.matchs_joues, minutes_jouees: p.minutes_jouees, note_moyenne: p.note_moyenne,
  };
  const months = monthsUntil(p.contrat_fin);
  const mv = p.valeur_marchande != null && p.valeur_marchande !== "" ? Number(p.valeur_marchande) : null;

  return {
    age:          age != null ? ageScore(age, bands) : null,
    contract:     isNaN(months) ? null : contractScore(months, false, bands),
    level:        deriveLevelNote({ league_tier: p.league_tier, league_code: p.league_code }),
    production:   deriveProductionNote(stats, poste, bands),
    market_value: mv != null && !isNaN(mv) ? marketValueScore(mv, bands) : null,
    fit:          fitScore({ positions: poste, age: p.age, division: p.ligue || p.division, country: p.pays, pied: p.pied_fort || p.pied }, target),
    // Non dérivables d'une fiche stockée (données de sourcing / saisie manuelle).
    agency: null, market: null,
    stat_shooting: null, stat_passing: null, stat_possession: null, stat_defending: null,
  };
}

// Score d'un joueur stocké : ne note que les critères ACTIVÉS dont la donnée est
// disponible. Le tier est projeté sur le max complet (critères actifs) pour
// rester comparable au score du formulaire de recrutement.
export function scorePlayerFromData(player = {}, {
  config = getCriteriaConfig(), target = getTargetProfile(), bands = getBandsConfig(), tiers = getTiers(),
} = {}) {
  const notes = notesFromPlayer(player, { target, bands });
  const usable = config.filter((c) => c.enabled && notes[c.key] != null);
  const { total, max, breakdown } = scoreMajor(notes, usable);
  const fullMax = currentScoreMax(config);
  const projected = max > 0 ? (total / max) * fullMax : 0;
  return {
    total, max, breakdown,
    hasData: usable.length > 0,
    ratio: max > 0 ? total / max : 0,
    tier: scoreTier(projected, tiers),
  };
}

// ── Scoring joueur MINEUR (§12) — 6 critères 0..3, total /18, indicatif ──────
export const MINOR_CRITERIA = [
  { key: "live",        label: "Observation live", hint: "jamais / 1 fois / 2-3 / plusieurs + contexte" },
  { key: "technique",   label: "Qualité technique" },
  { key: "physique",    label: "Qualité physique" },
  { key: "mental",      label: "Intelligence / mental" },
  { key: "progression", label: "Progression" },
  { key: "contexte",    label: "Contexte" },
];
export function scoreMinor(notes = {}) {
  const breakdown = MINOR_CRITERIA.map((c) => ({ key: c.key, label: c.label, note: clampInt(notes[c.key], 0, 3) }));
  const total = breakdown.reduce((s, b) => s + b.note, 0);
  return { total, breakdown };
}

// ── Statut CRM dérivé — depuis le SCORE seul ─────────────────────────────────
// La logique de conformité (feux vert/orange/rouge) a été retirée du module de
// recrutement : le statut pipeline ne dépend plus que du score (et du cas mineur).
export function deriveStatus({ is_minor, score, minor_requirements_ok }, tiers = getTiers()) {
  if (is_minor) {
    return score >= 14 && minor_requirements_ok ? "monitor_high" : "monitor";
  }
  if (score >= tiers.priority) return "contact_ready";
  if (score >= tiers.contact) return "qualified";
  if (score >= tiers.watch) return "watchlist";
  return "closed_lost"; // abandon
}

// Libellés CRM (§14) pour l'affichage.
export const CRM_STATUS = {
  long_list:    { label: "Long list",     color: "bg-slate-100 text-slate-600" },
  qualified:    { label: "Qualified",     color: "bg-blue-100 text-blue-700" },
  watchlist:    { label: "Watchlist",     color: "bg-amber-100 text-amber-700" },
  contact_ready:{ label: "Contact ready", color: "bg-emerald-100 text-emerald-700" },
  contacted:    { label: "Contacted",     color: "bg-indigo-100 text-indigo-700" },
  replied:      { label: "Replied",       color: "bg-violet-100 text-violet-700" },
  call_done:    { label: "Call done",     color: "bg-fuchsia-100 text-fuchsia-700" },
  mandate:      { label: "Mandate / Collab", color: "bg-green-100 text-green-700" },
  closed_lost:  { label: "Closed lost",   color: "bg-slate-100 text-slate-400" },
  monitor:      { label: "Monitor (mineur)", color: "bg-amber-100 text-amber-700" },
  monitor_high: { label: "Monitor + (mineur)", color: "bg-orange-100 text-orange-700" },
};
export const CRM_ORDER = ["long_list", "qualified", "watchlist", "contact_ready", "contacted", "replied", "call_done", "mandate", "monitor", "monitor_high", "closed_lost"];

// ── Pont vers la Simulation 360 (module transfert) ──────────────────────────
// Mappe un pays (texte libre) vers un code fiscal connu de la Simulation 360.
const COUNTRY_CODE = {
  france: "FR", belgique: "BE", belgium: "BE", "pays-bas": "NL", netherlands: "NL", holland: "NL",
  espagne: "ES", spain: "ES", angleterre: "GB", england: "GB", uk: "GB", "royaume-uni": "GB",
  italie: "IT", italy: "IT", allemagne: "DE", germany: "DE", autriche: "AT", austria: "AT", portugal: "PT",
};
export function countryToCode(country) {
  const k = String(country || "").trim().toLowerCase();
  return COUNTRY_CODE[k] || "FR";
}

// Pré-remplit les inputs de la Simulation 360 depuis un dossier de recrutement.
export function caseToDealInputs(c = {}) {
  return {
    pays: countryToCode(c.country),
    annee: "2026",
    age: c.age != null && c.age !== "" ? String(c.age) : "",
    annees: "3",
    prixAchat: c.market_value ? String(Math.round(Number(c.market_value) * 1_000_000)) : "",
    tauxAgentJoueur: "5",
    tauxAgentVendeur: "10",
    solidariteRate: "5",
    bonusProba: "50",
    nbEcheances: "1",
  };
}
