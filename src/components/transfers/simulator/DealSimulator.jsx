import React, { useState, useMemo, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle, Briefcase, ArrowDownLeft, ArrowUpRight, ShieldAlert, ShieldCheck, AlertTriangle, Layers, FileDown, Loader2, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/useCurrentUser";
import SaveBar from "./SaveBar";
import { PAYS_CODES, ANNEES_FISCALES, TAX_YEAR_DEFAULT, getTaxProfile, getRegimes, estimerTauxSalarie, RESIDENCE_OPTIONS, SITUATION_OPTIONS } from "../../../lib/taxProfiles";
import { fmtEUR, toNum, ageFromDob } from "../../../lib/transferCalc";
import { exportNodeToPdf } from "../../../lib/exportPdf";
import { useAgentRules } from "../../../lib/useAgentRules";

/**
 * Simulation 360 — le même deal lu par les 4 acteurs (cahier ProPulse §9/§13).
 * Un seul formulaire alimente : net joueur, coût total acheteur, net vendeur
 * (waterfall §7.1), profit net agent (§6) + alertes de conformité (§10).
 * Le rôle (§2) et le type d'opération (§3), pilotés par le parent, déterminent
 * les blocs de saisie et de résultat affichés.
 */
// Visibilité des blocs par rôle (cahier §9).
const showJoueur   = (r) => ["complet", "joueur", "agent", "acheteur"].includes(r);
const showAgent    = (r) => ["complet", "agent"].includes(r);
const showAcheteur = (r) => ["complet", "agent", "acheteur"].includes(r);
const showVendeurRole = (r) => ["complet", "agent", "vendeur"].includes(r);

// Opérations comportant une indemnité de transfert (cahier §3).
const OPS_AVEC_TRANSFERT = ["transfert_payant", "pret", "pret_option"];
// Opérations de type "club actuel" → comparer ancien vs nouveau salaire (§3).
const OPS_RENEGO = ["renouvellement", "renegociation"];

const Field = ({ label, value, onChange, ph, suffix = "€" }) => (
  <div>
    <Label className="text-[11px] text-slate-500 mb-1 block">{label}</Label>
    <div className="relative">
      <Input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} className={suffix ? "pr-9 h-9" : "h-9"} />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>}
    </div>
  </div>
);

const Row = ({ label, value, strong, color = "text-slate-800" }) => (
  <div className="flex items-center justify-between py-1 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`${strong ? "font-bold" : "font-medium"} ${color}`}>{value}</span>
  </div>
);

const Block = ({ icon: Icon, title, accent, children }) => (
  <div className={`rounded-xl border p-4 ${accent}`}>
    <div className="flex items-center gap-2 mb-2 font-semibold text-slate-800">
      <Icon className="w-4 h-4" /> {title}
    </div>
    {children}
  </div>
);

export default function DealSimulator({ player, role = "complet", operation = "transfert_payant", openSim = null, prefill = null }) {
  const hasTransfer = OPS_AVEC_TRANSFERT.includes(operation);
  const isRenego = OPS_RENEGO.includes(operation);
  const showVendeur = (r) => showVendeurRole(r) && hasTransfer;

  // Fiscalité joueur
  const [pays, setPays] = useState("FR");
  const [annee, setAnnee] = useState(String(TAX_YEAR_DEFAULT));
  const [regime, setRegime] = useState("");
  const [residency, setResidency] = useState("resident");
  const [marital, setMarital] = useState("single");
  const [enfants, setEnfants] = useState("0");
  const [age, setAge] = useState("");
  const [salaireBrut, setSalaireBrut] = useState("");
  const [ancienSalaire, setAncienSalaire] = useState(""); // renouvellement / renégociation
  const [annees, setAnnees] = useState("3");
  const [signingFee, setSigningFee] = useState("");
  const [primes, setPrimes] = useState("");
  const [avantages, setAvantages] = useState("");
  // Transfert
  const [prixAchat, setPrixAchat] = useState("");
  const [bonus, setBonus] = useState("");
  const [bonusProba, setBonusProba] = useState("50");
  const [solidariteRate, setSolidariteRate] = useState("5");
  const [nbEcheances, setNbEcheances] = useState("1"); // paiement du transfert en N annuités (§7/§8)
  // Agent
  const [tauxAgentJoueur, setTauxAgentJoueur] = useState("5");
  const [tauxAgentVendeur, setTauxAgentVendeur] = useState("10");
  const [agentForfait, setAgentForfait] = useState("");
  const [agentFrais, setAgentFrais] = useState("");
  const [agentTaxePct, setAgentTaxePct] = useState("0");
  // Vendeur (waterfall)
  const [sellOnRate, setSellOnRate] = useState("");
  const [partJoueurRate, setPartJoueurRate] = useState("");
  const [autresDeductions, setAutresDeductions] = useState("");
  // Acheteur (extras + budget)
  const [relocation, setRelocation] = useState("");
  const [budgetTotal, setBudgetTotal] = useState("");
  const [budgetSalarial, setBudgetSalarial] = useState("");

  // Préremplissage depuis la fiche joueur (M€ → €).
  useEffect(() => {
    if (!player) return;
    if (player.salaire) setSalaireBrut(String(Math.round(player.salaire * 1_000_000)));
    if (player.valeur_marchande) setPrixAchat(String(Math.round(player.valeur_marchande * 1_000_000)));
    const a = player.age ?? ageFromDob(player.date_naissance);
    if (a != null) setAge(String(a));
  }, [player?.id]);

  const regimesDispo = getRegimes(pays);

  const r = useMemo(() => {
    const brut = toNum(salaireBrut);
    const dur = Math.max(1, toNum(annees) || 1);
    const ageNum = age !== "" ? toNum(age) : null;
    const fisc = estimerTauxSalarie({
      code: pays, year: Number(annee), grossAnnual: brut,
      residency, marital, children: toNum(enfants), regime, age: ageNum,
    });
    const t = fisc.tauxSalarie;
    const tp = fisc.tauxPatronal;

    // Joueur
    const netJoueurAn = brut * (1 - t);
    const impots = brut - netJoueurAn;
    const signingNet = toNum(signingFee) * (1 - t);
    const primesNet = toNum(primes) * (1 - t);
    const valeurContratBrut = brut * dur + toNum(signingFee) + toNum(primes) * dur;
    // Renouvellement / renégociation : écart de net vs ancien salaire (§3).
    const ancienNet = isRenego && toNum(ancienSalaire) > 0 ? toNum(ancienSalaire) * (1 - t) : null;
    const ecartNet = ancienNet != null ? netJoueurAn - ancienNet : null;

    // Acheteur (§8.1)
    const annualWage = brut + toNum(primes) + toNum(avantages);
    const annualEmployer = annualWage * tp;
    const totalContract = (annualWage + annualEmployer) * dur + toNum(signingFee);
    const expectedBonus = toNum(bonus) * (Math.min(100, Math.max(0, toNum(bonusProba))) / 100);
    const transferCost = toNum(prixAchat) + expectedBonus;
    const agentBuyer = brut * dur * (toNum(tauxAgentJoueur) / 100); // agent joueur payé par le club
    const buyerTotal = transferCost + totalContract + agentBuyer + toNum(relocation);
    const coutAnnee1 = transferCost + annualWage + annualEmployer + toNum(signingFee) + agentBuyer;

    // Vendeur (§7.1)
    const grossSeller = toNum(prixAchat) + expectedBonus;
    const solidarityDue = grossSeller * (toNum(solidariteRate) / 100);
    const sellOnDue = toNum(prixAchat) * (toNum(sellOnRate) / 100);
    const sellerAgentFee = toNum(prixAchat) * (toNum(tauxAgentVendeur) / 100);
    const playerShareDue = grossSeller * (toNum(partJoueurRate) / 100);
    const sellerNet = grossSeller - solidarityDue - sellOnDue - sellerAgentFee - playerShareDue - toNum(autresDeductions);

    // Agent (§6)
    const commJoueur = brut * dur * (toNum(tauxAgentJoueur) / 100) + toNum(agentForfait);
    const commVendeur = toNum(prixAchat) * (toNum(tauxAgentVendeur) / 100);
    const commBrute = commJoueur + commVendeur;
    const agentTaxes = commBrute * (toNum(agentTaxePct) / 100);
    const profitNet = commBrute - toNum(agentFrais) - agentTaxes;

    // Cash-flow par échéances (§7/§8) : transfert payé en N annuités ; salaire +
    // charges chaque année du contrat ; signing/agent/relocation à l'année 1.
    const N = Math.max(1, Math.floor(toNum(nbEcheances) || 1));
    const horizon = Math.max(N, dur);
    const transferPerYear = transferCost / N;
    const sellerNetPerYear = sellerNet / N;
    const echeances = [];
    for (let y = 1; y <= horizon; y++) {
      const transferIn = y <= N ? transferPerYear : 0;
      const salaire = y <= dur ? annualWage + annualEmployer : 0;
      const oneOff = y === 1 ? toNum(signingFee) + agentBuyer + toNum(relocation) : 0;
      echeances.push({ annee: y, acheteurOut: transferIn + salaire + oneOff, vendeurIn: y <= N ? sellerNetPerYear : 0 });
    }

    // Alertes (§10)
    const alerts = [];
    if (ageNum != null && ageNum < 18)
      alerts.push({ level: "red", t: "Joueur mineur", m: "RSTP art. 19 : protection des mineurs, signature tuteur, restrictions de commission." });
    if (toNum(budgetTotal) > 0 && buyerTotal > toNum(budgetTotal))
      alerts.push({ level: "red", t: "Budget total dépassé", m: `Coût acheteur ${fmtEUR(buyerTotal)} > budget ${fmtEUR(toNum(budgetTotal))}.` });
    if (toNum(budgetSalarial) > 0 && (annualWage + annualEmployer) > toNum(budgetSalarial))
      alerts.push({ level: "red", t: "Budget salarial dépassé", m: `Coût salarial année 1 ${fmtEUR(annualWage + annualEmployer)} > budget ${fmtEUR(toNum(budgetSalarial))}.` });
    if (toNum(prixAchat) > 0 && toNum(solidariteRate) === 0)
      alerts.push({ level: "amber", t: "Solidarité non renseignée", m: "Indemnité de transfert > 0 mais solidarité FIFA à 0 % : à vérifier avec l'historique formateur (EPP)." });
    if (regime)
      alerts.push({ level: "amber", t: "Régime fiscal spécial", m: "Régime favorable activé : à n'utiliser que si les critères d'éligibilité sont réellement remplis." });
    if (!alerts.some((a) => a.level === "red"))
      alerts.unshift({ level: "green", t: "Pas de zone rouge", m: "Aucun blocage détecté sur les points vérifiés ici. Estimation — à valider avant signature." });

    return {
      fisc, t, netJoueurAn, impots, signingNet, primesNet, valeurContratBrut, ancienNet, ecartNet,
      annualWage, annualEmployer, totalContract, transferCost, agentBuyer, buyerTotal, coutAnnee1, expectedBonus,
      grossSeller, solidarityDue, sellOnDue, sellerAgentFee, playerShareDue, sellerNet,
      commJoueur, commVendeur, commBrute, agentTaxes, profitNet, alerts, echeances,
    };
  }, [pays, annee, regime, residency, marital, enfants, age, salaireBrut, ancienSalaire, isRenego, annees, signingFee, primes, avantages,
      prixAchat, bonus, bonusProba, solidariteRate, nbEcheances, tauxAgentJoueur, tauxAgentVendeur, agentForfait, agentFrais, agentTaxePct,
      sellOnRate, partJoueurRate, autresDeductions, relocation, budgetTotal, budgetSalarial]);

  const filled = toNum(salaireBrut) > 0 || toNum(prixAchat) > 0;

  const inputs = {
    pays, annee, regime, residency, marital, enfants, age, salaireBrut, ancienSalaire, annees, signingFee, primes, avantages,
    prixAchat, bonus, bonusProba, solidariteRate, nbEcheances, tauxAgentJoueur, tauxAgentVendeur, agentForfait, agentFrais, agentTaxePct,
    sellOnRate, partJoueurRate, autresDeductions, relocation, budgetTotal, budgetSalarial,
  };
  const setters = {
    pays: setPays, annee: setAnnee, regime: setRegime, residency: setResidency, marital: setMarital,
    enfants: setEnfants, age: setAge, salaireBrut: setSalaireBrut, ancienSalaire: setAncienSalaire, annees: setAnnees, signingFee: setSigningFee,
    primes: setPrimes, avantages: setAvantages, prixAchat: setPrixAchat, bonus: setBonus, bonusProba: setBonusProba,
    solidariteRate: setSolidariteRate, nbEcheances: setNbEcheances, tauxAgentJoueur: setTauxAgentJoueur, tauxAgentVendeur: setTauxAgentVendeur,
    agentForfait: setAgentForfait, agentFrais: setAgentFrais, agentTaxePct: setAgentTaxePct, sellOnRate: setSellOnRate,
    partJoueurRate: setPartJoueurRate, autresDeductions: setAutresDeductions, relocation: setRelocation,
    budgetTotal: setBudgetTotal, budgetSalarial: setBudgetSalarial,
  };
  const handleLoad = (o) => {
    if (!o || typeof o !== "object") return;
    Object.entries(setters).forEach(([k, set]) => { if (o[k] !== undefined) set(o[k]); });
  };

  // Pré-remplissage depuis un dossier de recrutement (sans marquer comme « chargé »
  // → la sauvegarde crée un nouveau dossier).
  useEffect(() => { if (prefill) handleLoad(prefill); }, [prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Envoi de la commission agent vers Finance (entrée, projection) ──────────
  const me = useCurrentUser();
  const [sentFin, setSentFin] = useState(false);
  useEffect(() => { setSentFin(false); }, [player?.id]);

  const finType = (operation === "renouvellement" || operation === "renegociation")
    ? "renouvellement_contrat" : operation === "transfert_payant" ? "transfert" : "autre";

  const sendToFinance = useMutation({
    mutationFn: () => base44.entities.Commission.create({
      titre: `Commission agent — ${player?.nom || "joueur"}`,
      sens: "entree",
      nature: "projection",
      type: finType,
      player_id: player?.id || "",
      player_nom: player?.nom || "",
      club: player?.club_actuel || "",
      montant_operation: toNum(prixAchat) ? toNum(prixAchat) / 1_000_000 : null,
      montant: Math.round(r?.commBrute || 0),
      devise: "EUR",
      statut: "a_facturer",
      simulation_id: openSim?.id || "",
      organization_id: me?.organization_id ?? null,
    }),
    onSuccess: () => setSentFin(true),
  });

  const resume = filled
    ? `Net joueur ${fmtEUR(r.netJoueurAn)}/an · coût acheteur ${fmtEUR(r.buyerTotal)} · net vendeur ${fmtEUR(r.sellerNet)}`
    : "";

  const STYLE = {
    red:   { box: "bg-red-50 border-red-200 text-red-800",       Icon: ShieldAlert,   ic: "text-red-500" },
    amber: { box: "bg-amber-50 border-amber-200 text-amber-800", Icon: AlertTriangle, ic: "text-amber-500" },
    green: { box: "bg-green-50 border-green-200 text-green-800", Icon: ShieldCheck,   ic: "text-green-600" },
  };

  // Conformité commissions (§6.1) : plafond national prioritaire sinon grille FIFA.
  const { ruleFor } = useAgentRules();
  const natRule = ruleFor(pays);
  const refJoueur = natRule ? toNum(natRule.taux_joueur) : 5;
  const refVendeur = natRule ? toNum(natRule.taux_vendeur) : 10;
  const riskOf = (saisi, ref) => (saisi <= ref + 1e-9 ? "green" : saisi <= ref * 1.5 ? "amber" : "red");
  const legJoueur = { saisi: toNum(tauxAgentJoueur), ref: refJoueur, risk: riskOf(toNum(tauxAgentJoueur), refJoueur) };
  const legVendeur = { saisi: toNum(tauxAgentVendeur), ref: refVendeur, risk: riskOf(toNum(tauxAgentVendeur), refVendeur) };
  const legs = hasTransfer ? [legJoueur, legVendeur] : [legJoueur];
  const worstRisk = legs.some((l) => l.risk === "red") ? "red" : legs.some((l) => l.risk === "amber") ? "amber" : "green";
  const RISK = {
    green: "bg-green-50 border-green-200 text-green-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    red:   "bg-red-50 border-red-200 text-red-800",
  };

  const recapRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const titre = `Simulation 360 — ${player?.nom || "deal"}`;
      await exportNodeToPdf(recapRef.current, `Simulation360 - ${player?.nom || "deal"}.pdf`, { title: titre, orientation: "portrait" });
    } catch { /* export bonus — silencieux */ }
    finally { setExporting(false); }
  };

  return (
    <div className="space-y-4">
      <SaveBar module="deal" inputs={inputs} resume={resume} playerId={player?.id} playerName={player?.nom} onLoad={handleLoad} canSave={filled} openSim={openSim} />

      {/* ── SAISIE ─────────────────────────────────────────────── */}
      {showJoueur(role) && (
        <div className="border border-slate-200 rounded-xl p-3 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fiscalité & contrat joueur</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Pays</Label>
              <Select value={pays} onValueChange={(v) => { setPays(v); setRegime(""); }}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{PAYS_CODES.map((c) => { const p = getTaxProfile(c); return <SelectItem key={c} value={c}>{p.drapeau} {p.nom}</SelectItem>; })}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Année</Label>
              <Select value={annee} onValueChange={setAnnee}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{ANNEES_FISCALES.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Résidence</Label>
              <Select value={residency} onValueChange={setResidency}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{RESIDENCE_OPTIONS.map((o) => <SelectItem key={o.id} value={o.id}>{o.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Situation</Label>
              <Select value={marital} onValueChange={setMarital}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{SITUATION_OPTIONS.map((o) => <SelectItem key={o.id} value={o.id}>{o.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {regimesDispo.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <Label className="text-[11px] text-slate-500 mb-1 block">Régime fiscal</Label>
                <Select value={regime || "__std__"} onValueChange={(v) => setRegime(v === "__std__" ? "" : v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__std__">Standard</SelectItem>
                    {regimesDispo.map((rg) => <SelectItem key={rg.id} value={rg.id}>{rg.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label={isRenego ? "Nouveau salaire brut / an" : "Salaire brut / an"} value={salaireBrut} onChange={setSalaireBrut} ph="300000" />
            {isRenego && <Field label="Ancien salaire brut / an" value={ancienSalaire} onChange={setAncienSalaire} ph="120000" />}
            <Field label="Durée" value={annees} onChange={setAnnees} ph="3" suffix="ans" />
            <Field label="Âge" value={age} onChange={setAge} ph="25" suffix="ans" />
            <Field label="Nb enfants" value={enfants} onChange={setEnfants} ph="0" suffix="" />
            <Field label="Signing fee" value={signingFee} onChange={setSigningFee} ph="0" />
            <Field label="Primes garanties / an" value={primes} onChange={setPrimes} ph="0" />
            <Field label="Avantages / an" value={avantages} onChange={setAvantages} ph="0" />
          </div>
        </div>
      )}

      {hasTransfer && (showAcheteur(role) || showVendeur(role) || showAgent(role)) && (
        <div className="border border-slate-200 rounded-xl p-3 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Transfert</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Indemnité de transfert" value={prixAchat} onChange={setPrixAchat} ph="1000000" />
            <Field label="Bonus conditionnels" value={bonus} onChange={setBonus} ph="0" />
            <Field label="Probabilité bonus" value={bonusProba} onChange={setBonusProba} ph="50" suffix="%" />
            <Field label="Solidarité FIFA" value={solidariteRate} onChange={setSolidariteRate} ph="5" suffix="%" />
            <Field label="Nb d'annuités (paiement)" value={nbEcheances} onChange={setNbEcheances} ph="1" suffix="ans" />
          </div>
        </div>
      )}

      {(showAgent(role) || showAcheteur(role) || showVendeur(role)) && (
        <div className="border border-slate-200 rounded-xl p-3 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Commissions agent</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Taux agent joueur" value={tauxAgentJoueur} onChange={setTauxAgentJoueur} ph="5" suffix="%" />
            {hasTransfer && <Field label="Taux agent vendeur" value={tauxAgentVendeur} onChange={setTauxAgentVendeur} ph="10" suffix="%" />}
            {showAgent(role) && <Field label="Forfait fixe" value={agentForfait} onChange={setAgentForfait} ph="0" />}
            {showAgent(role) && <Field label="Frais généraux agence" value={agentFrais} onChange={setAgentFrais} ph="0" />}
            {showAgent(role) && <Field label="Taxes/TVA agence" value={agentTaxePct} onChange={setAgentTaxePct} ph="0" suffix="%" />}
          </div>
        </div>
      )}

      {showVendeur(role) && (
        <div className="border border-slate-200 rounded-xl p-3 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Déductions vendeur (waterfall)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Sell-on dû (ancien club)" value={sellOnRate} onChange={setSellOnRate} ph="0" suffix="%" />
            <Field label="Part joueur / loyalty" value={partJoueurRate} onChange={setPartJoueurRate} ph="0" suffix="%" />
            <Field label="Autres déductions" value={autresDeductions} onChange={setAutresDeductions} ph="0" />
          </div>
        </div>
      )}

      {showAcheteur(role) && (
        <div className="border border-slate-200 rounded-xl p-3 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Coûts annexes & budget acheteur</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Coûts annexes (relocation…)" value={relocation} onChange={setRelocation} ph="0" />
            <Field label="Budget total" value={budgetTotal} onChange={setBudgetTotal} ph="0" />
            <Field label="Budget salarial / an" value={budgetSalarial} onChange={setBudgetSalarial} ph="0" />
          </div>
        </div>
      )}

      {!filled && (
        <div className="flex items-center gap-2 text-sm text-slate-400 justify-center py-6">
          <Layers className="w-4 h-4" /> Renseignez un salaire ou une indemnité de transfert pour lancer la simulation.
        </div>
      )}

      {/* ── RÉCAP PAR ACTEUR (§9) ──────────────────────────────── */}
      {filled && (
        <div className="flex justify-end">
          <Button onClick={handleExport} size="sm" variant="outline" className="gap-1.5" disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Export PDF
          </Button>
        </div>
      )}

      <div ref={recapRef} className="space-y-4">
      {filled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {showJoueur(role) && (
            <Block icon={UserCircle} title="Joueur" accent="border-green-200 bg-green-50/40">
              <Row label="Net annuel" value={fmtEUR(r.netJoueurAn)} strong color="text-green-700" />
              <Row label="Net mensuel" value={fmtEUR(r.netJoueurAn / 12)} color="text-green-700" />
              {r.ecartNet != null && (
                <Row label="Écart vs ancien net" value={`${r.ecartNet >= 0 ? "+" : ""}${fmtEUR(r.ecartNet)}`} color={r.ecartNet >= 0 ? "text-green-700" : "text-red-600"} />
              )}
              <Row label="Impôts & cotisations / an" value={fmtEUR(r.impots)} color="text-slate-700" />
              <Row label="Signing fee net" value={fmtEUR(r.signingNet)} />
              <Row label="Valeur contrat (brut, durée)" value={fmtEUR(r.valeurContratBrut)} />
              <div className="text-[11px] text-slate-400 mt-1">Taux effectif {(r.t * 100).toFixed(0)} % · palier {r.fisc.tier}{r.fisc.regimeApplied ? ` · ${r.fisc.regimeApplied}` : ""}</div>
            </Block>
          )}
          {showAcheteur(role) && (
            <Block icon={ArrowDownLeft} title="Club acheteur" accent="border-orange-200 bg-orange-50/40">
              <Row label="Indemnité + bonus probables" value={fmtEUR(r.transferCost)} />
              <Row label="Coût salarial année 1" value={fmtEUR(r.annualWage + r.annualEmployer)} />
              <Row label="Commission agent (payée club)" value={fmtEUR(r.agentBuyer)} />
              <Row label="Coût année 1" value={fmtEUR(r.coutAnnee1)} color="text-orange-700" />
              <Row label="Coût total du deal" value={fmtEUR(r.buyerTotal)} strong color="text-orange-700" />
            </Block>
          )}
          {showVendeur(role) && (
            <Block icon={ArrowUpRight} title="Club vendeur" accent="border-blue-200 bg-blue-50/40">
              <Row label="Prix brut (indemnité + bonus)" value={fmtEUR(r.grossSeller)} />
              <Row label="− Solidarité FIFA" value={fmtEUR(r.solidarityDue)} color="text-slate-600" />
              <Row label="− Sell-on dû" value={fmtEUR(r.sellOnDue)} color="text-slate-600" />
              <Row label="− Agent vendeur" value={fmtEUR(r.sellerAgentFee)} color="text-slate-600" />
              <Row label="− Part joueur / loyalty" value={fmtEUR(r.playerShareDue)} color="text-slate-600" />
              <Row label="Net vendeur" value={fmtEUR(r.sellerNet)} strong color="text-blue-700" />
            </Block>
          )}
          {showAgent(role) && (
            <Block icon={Briefcase} title="Agent / agence" accent="border-indigo-200 bg-indigo-50/40">
              <Row label="Commission joueur" value={fmtEUR(r.commJoueur)} />
              <Row label="Commission vendeur" value={fmtEUR(r.commVendeur)} />
              <Row label="Commission brute totale" value={fmtEUR(r.commBrute)} color="text-indigo-700" />
              <Row label="− Frais + taxes" value={fmtEUR(toNum(agentFrais) + r.agentTaxes)} color="text-slate-600" />
              <Row label="Profit net agence" value={fmtEUR(r.profitNet)} strong color="text-indigo-700" />
              <button
                onClick={() => sendToFinance.mutate()}
                disabled={sentFin || sendToFinance.isPending || !(r.commBrute > 0)}
                className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                title="Crée une entrée « commission agent » (projection) dans Finance"
              >
                {sendToFinance.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                {sentFin ? "Envoyé vers Finance ✓" : "Envoyer la commission vers Finance"}
              </button>
              {sendToFinance.isError && <p className="text-[11px] text-red-500 mt-1">Échec de l'envoi vers Finance.</p>}
            </Block>
          )}
        </div>
      )}

      {/* ── CONFORMITÉ COMMISSIONS (§6.1) ──────────────────────── */}
      {filled && showAgent(role) && (
        <div className={`rounded-xl border px-4 py-3 ${RISK[worstRisk]}`}>
          <div className="font-semibold text-sm mb-1.5">
            Conformité commissions — {natRule ? `règle nationale ${natRule.pays_nom || natRule.pays}` : "grille FIFA théorique"}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>Agent joueur : <b>{legJoueur.saisi}%</b> vs plafond <b>{legJoueur.ref}%</b> — écart {legJoueur.saisi - legJoueur.ref >= 0 ? "+" : ""}{(legJoueur.saisi - legJoueur.ref).toFixed(1)} pt</div>
            {hasTransfer && <div>Agent vendeur : <b>{legVendeur.saisi}%</b> vs plafond <b>{legVendeur.ref}%</b> — écart {legVendeur.saisi - legVendeur.ref >= 0 ? "+" : ""}{(legVendeur.saisi - legVendeur.ref).toFixed(1)} pt</div>}
          </div>
          <div className="text-[10px] opacity-80 mt-1.5">Indicatif et non bloquant. {natRule ? "Règle nationale active (prioritaire sur la grille FIFA)." : "Grille FIFA théorique — vérifier le droit national applicable."}</div>
        </div>
      )}

      {/* ── CASH-FLOW PAR ÉCHÉANCE (§7/§8) ─────────────────────── */}
      {filled && (showAcheteur(role) || showVendeur(role)) && r.echeances.length > 1 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">Cash-flow par échéance</div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="text-left px-3 py-1.5 font-medium">Année</th>
                {showAcheteur(role) && <th className="text-right px-3 py-1.5 font-medium">Décaissement acheteur</th>}
                {showVendeur(role) && <th className="text-right px-3 py-1.5 font-medium">Encaissement vendeur (net)</th>}
              </tr>
            </thead>
            <tbody>
              {r.echeances.map((e) => (
                <tr key={e.annee} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 text-slate-600">Année {e.annee}</td>
                  {showAcheteur(role) && <td className="px-3 py-1.5 text-right text-orange-700">{fmtEUR(e.acheteurOut)}</td>}
                  {showVendeur(role) && <td className="px-3 py-1.5 text-right text-blue-700">{fmtEUR(e.vendeurIn)}</td>}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold">
              <tr className="border-t border-slate-200">
                <td className="px-3 py-1.5 text-slate-700">Total</td>
                {showAcheteur(role) && <td className="px-3 py-1.5 text-right text-orange-700">{fmtEUR(r.echeances.reduce((s, e) => s + e.acheteurOut, 0))}</td>}
                {showVendeur(role) && <td className="px-3 py-1.5 text-right text-blue-700">{fmtEUR(r.echeances.reduce((s, e) => s + e.vendeurIn, 0))}</td>}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── ALERTES (§10) ──────────────────────────────────────── */}
      {filled && (
        <div className="space-y-2">
          {r.alerts.map((al, i) => {
            const s = STYLE[al.level];
            return (
              <div key={i} className={`flex items-start gap-2 border rounded-lg px-3 py-2 text-xs ${s.box}`}>
                <s.Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${s.ic}`} />
                <div><span className="font-semibold">{al.t} — </span>{al.m}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>Estimations (cahier ProPulse) : taux fiscaux 2 paliers simplifiés, conformité indicative. À valider par un fiscaliste et un juriste du sport avant tout engagement contractuel.</span>
      </div>
      </div>
    </div>
  );
}
