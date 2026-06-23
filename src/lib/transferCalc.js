/**
 * Formules pures du Simulateur de transfert (ProPulse), tirées du cours FIFA.
 * Volontairement simples : la logique du moteur. Les règles fines par pays sont
 * gérées via les profils fiscaux (taxProfiles.js).
 *
 * Aucune dépendance, aucun effet de bord → facile à tester et à réutiliser.
 */

// ── Formatage ────────────────────────────────────────────────────────────────
export const fmtEUR = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(n) || 0);

// Montant en millions d'euros (convention de l'app : valeur_marchande, montant…)
export const fmtM = (n) => `${(Number(n) || 0).toFixed(2)} M€`;

export const fmtPct = (r) => `${((Number(r) || 0) * 100).toFixed(1)} %`;

export const toNum = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
};

// Âge (années révolues) à partir d'une date de naissance ISO (YYYY-MM-DD).
export function ageFromDob(dob) {
  if (!dob) return null;
  const b = new Date(dob);
  if (isNaN(b.getTime())) return null;
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a >= 0 && a < 120 ? a : null;
}

// ── Salaire joueur (module Salaire) ──────────────────────────────────────────
// Rémunération brute garantie d'un contrat.
export function packageBrut({ salaireAnnuel, anneesContrat = 1, signingFee = 0, primesGaranties = 0 }) {
  return salaireAnnuel * anneesContrat + signingFee + primesGaranties;
}

// Net = brut × (1 − taux effectif salarié).
export function netFromBrut(brut, tauxSalarie) {
  return brut * (1 - tauxSalarie);
}

// Coût employeur (club) = brut + charges patronales + avantages.
export function coutEmployeur({ brut, tauxPatronal, avantages = 0 }) {
  return brut * (1 + tauxPatronal) + avantages;
}

// ── Transfert (module Transfert) ─────────────────────────────────────────────
// Coût d'acquisition côté acheteur (volet transfert), hors salaire.
export function coutTransfert({ indemniteFixe, bonus = 0, fraisPret = 0 }) {
  return indemniteFixe + bonus + fraisPret;
}

// Solidarité FIFA (Art. 21 / Annexe 5) : 5 % de la base par défaut.
export function solidarite(base, taux = 0.05) {
  return base * taux;
}

// Net encaissé par le club vendeur après déductions.
export function netVendeur({ transfertPercu, solidariteMontant = 0, commissionAgentVendeur = 0, autresDeductions = 0 }) {
  return transfertPercu - solidariteMontant - commissionAgentVendeur - autresDeductions;
}

// Coût total club acheteur = transfert + salaire + charges + agents + bonus.
export function coutTotalAcheteur({ coutTransfertVal = 0, coutSalaire = 0, fraisAgents = 0 }) {
  return coutTransfertVal + coutSalaire + fraisAgents;
}

// Clause de revente — sur le total ou sur la plus-value.
export function sellOnTotal(prixReventeFutur, taux) {
  return prixReventeFutur * taux;
}
export function sellOnProfit({ prixReventeFutur, prixAchatInitial, coutsDeductibles = 0, taux }) {
  return Math.max(0, prixReventeFutur - prixAchatInitial - coutsDeductibles) * taux;
}

// ── Commission agent (module Commission) ─────────────────────────────────────
// Commission = base × taux + forfait.
export function commissionAgent({ base, taux, forfait = 0 }) {
  return base * taux + forfait;
}

// Part d'un agent après partage agent-agent (split).
export function splitAgent(commission, pourcentage) {
  return commission * pourcentage;
}
