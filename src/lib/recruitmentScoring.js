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

// ── Scoring joueur MAJEUR (§7) — 6 critères notés 0..3, total /18 ────────────
// Chaque critère stocke directement une note 0..3 saisie/dérivée.
export const MAJOR_CRITERIA = [
  { key: "age",        label: "Âge",                hint: "26+ / 24-25 / 22-23 / 18-21" },
  { key: "contract",   label: "Contrat",            hint: ">24m / 18-24m / 12-18m / ≤12m ou libre" },
  { key: "level",      label: "Niveau joué",        hint: "D4-jeunes / D3 / D2 / D1 ou D2 forte" },
  { key: "production", label: "Production/minutes", hint: "faible / moyen / bon / élite" },
  { key: "agency",     label: "Agence",             hint: "verrouillé / grande / petite / sans agent" },
  { key: "market",     label: "Fit marché",         hint: "0 club / 2 / 3-4 / 5+" },
];

// Dérive la note d'âge (0..3) — 18-21 = 3, plus on vieillit moins de potentiel.
export function ageScore(age) {
  const a = Number(age) || 0;
  if (a >= 18 && a <= 21) return 3;
  if (a >= 22 && a <= 23) return 2;
  if (a >= 24 && a <= 25) return 1;
  return 0; // 26+
}
// Dérive la note de contrat (0..3) depuis les mois restants (0 = libre/court bon).
export function contractScore(monthsLeft, isFree) {
  if (isFree) return 3;
  const m = Number(monthsLeft);
  if (isNaN(m)) return 0;
  if (m <= 12) return 3;
  if (m <= 18) return 2;
  if (m <= 24) return 1;
  return 0;
}
// Fit marché depuis le nombre de clubs cibles réalistes.
export function marketScore(nbClubs) {
  const n = Number(nbClubs) || 0;
  if (n >= 5) return 3;
  if (n >= 3) return 2;
  if (n >= 2) return 1;
  return 0;
}

export function scoreMajor(notes = {}) {
  const breakdown = MAJOR_CRITERIA.map((c) => ({ key: c.key, label: c.label, note: clampInt(notes[c.key], 0, 3) }));
  const total = breakdown.reduce((s, b) => s + b.note, 0); // max 18
  return { total, breakdown };
}

// Libellé "tier" du score final (§7).
export function scoreTier(total) {
  if (total >= 16) return { key: "priority", label: "Priorité A", color: "green" };
  if (total >= 13) return { key: "contact",  label: "Contact (après validation)", color: "blue" };
  if (total >= 9)  return { key: "watch",    label: "Observation / watchlist", color: "amber" };
  return { key: "abandon", label: "Abandon", color: "slate" };
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

// ── Conformité : feux vert / orange / rouge (§13) ────────────────────────────
export function compliance(c = {}) {
  const reasons = [];
  let level = "green";
  const bump = (lvl) => { if (lvl === "red") level = "red"; else if (lvl === "amber" && level !== "red") level = "amber"; };

  if (c.is_minor && !c.fifa_agent_validated) { reasons.push("Mineur sans validation d'un agent FIFA"); bump("red"); }
  if (c.mandate_locked) { reasons.push("Mandat exclusif verrouillé confirmé"); bump("red"); }
  if (c.instagram && !c.instagram_validated) { reasons.push("Compte Instagram non validé (faux compte possible)"); bump("red"); }

  if (c.agency_status === "unknown") { reasons.push("Situation d'agence incertaine"); bump("amber"); }
  if (c.contract_long) { reasons.push("Contrat long (faible fenêtre)"); bump("amber"); }
  if (c.incomplete) { reasons.push("Fiche incomplète"); bump("amber"); }
  if (!c.is_minor && c.instagram && !c.instagram_validated && level !== "red") bump("amber");

  if (level === "green" && reasons.length === 0) reasons.push("Aucun point bloquant détecté");
  return { level, reasons };
}

// ── Statut CRM dérivé (§7 pseudo-code + §17) ─────────────────────────────────
export function deriveStatus({ is_minor, score, compliance_status, minor_requirements_ok }) {
  if (is_minor) {
    return score >= 14 && minor_requirements_ok ? "monitor_high" : "monitor";
  }
  if (score >= 16 && compliance_status === "green") return "contact_ready";
  if (score >= 13) return "qualified"; // contact après validation agent FIFA
  if (score >= 9) return "watchlist";
  return "closed_lost"; // abandon
}

// Peut-on passer "Contact ready" ? (§8 blocage / §17)
export function canBeContactReady(c = {}) {
  if (c.is_minor) return { ok: false, reason: "Mineur : approche directe interdite sans validation." };
  if (c.compliance_status === "red") return { ok: false, reason: "Conformité rouge : à corriger avant contact." };
  if (!c.instagram_validated) return { ok: false, reason: "Compte Instagram non validé." };
  if (c.mandate_locked) return { ok: false, reason: "Mandat exclusif verrouillé." };
  if ((Number(c.nb_clubs) || 0) < 3) return { ok: false, reason: "Moins de 3 clubs cibles réalistes." };
  if (!c.fifa_agent_validated) return { ok: false, reason: "Validation d'un agent FIFA requise." };
  return { ok: true, reason: "Conditions réunies pour un contact." };
}

// ── Génération du message de contact Instagram (§9) ──────────────────────────
// Message respectueux : mentionne un élément de saison, parle projet/contrat,
// demande si le joueur est accompagné. FR ou EN. Ne JAMAIS promettre un club.
export function generateMessage({ name = "", club = "", season_hint = "", language = "FR" }) {
  const prenom = String(name).split(" ")[0] || "";
  if (language === "EN") {
    return `Hi ${prenom}, I've been following your season at ${club || "your club"}${season_hint ? ` (${season_hint})` : ""} and I'm impressed by your progress. I work with ProPulse Agency & Academy on career planning and market positioning. Out of curiosity — are you currently represented? Happy to share a concrete plan if it's useful to you.`;
  }
  return `Bonjour ${prenom}, je suis ta saison à ${club || "ton club"}${season_hint ? ` (${season_hint})` : ""} et ta progression m'impressionne. Je travaille avec ProPulse Agency & Academy sur le projet de carrière et le positionnement marché. Par curiosité : es-tu accompagné actuellement ? Je peux te partager un plan concret si ça t'est utile.`;
}

// Le message ne se génère que si fiche complète + IG validé + conformité non rouge (§9/§17).
export function canGenerateMessage(c = {}) {
  return !!c.instagram_validated && c.compliance_status !== "red" && !c.incomplete && !c.is_minor;
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
