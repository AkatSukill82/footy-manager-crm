import React, { useState, useMemo, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, AlertTriangle } from "lucide-react";
import SaveBar from "./SaveBar";
import { commissionAgent, splitAgent, fmtEUR, toNum } from "../../../lib/transferCalc";

const NumField = ({ label, value, onChange, placeholder, suffix = "€" }) => (
  <div>
    <Label className="text-xs text-slate-500 mb-1 block">{label}</Label>
    <div className="relative">
      <Input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pr-10" />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>
    </div>
  </div>
);

const Stat = ({ label, value, color = "text-slate-900", sub }) => (
  <div className="bg-slate-50 rounded-lg p-4">
    <div className="text-xs text-slate-500 mb-1">{label}</div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
    {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
  </div>
);

export default function AgentCommissionSimulator({ player }) {
  // Le client de l'agent détermine la BASE de calcul (piège fréquent à éviter)
  const [client, setClient] = useState("joueur"); // joueur | club_acheteur | club_vendeur
  const [base, setBase] = useState("");
  const [annees, setAnnees] = useState("1");
  const [taux, setTaux] = useState("5");
  const [forfait, setForfait] = useState("");
  // Bonus conditionnel (revenu potentiel) + probabilité de réalisation
  const [bonus, setBonus] = useState("");
  const [proba, setProba] = useState("50");
  // Split éventuel avec un second agent (apporteur, co-mandat…)
  const [splitActif, setSplitActif] = useState("non");
  const [partAgent, setPartAgent] = useState("70");
  // Frais généraux & taxes agence → profit NET réel (cahier §6.2)
  const [fraisGeneraux, setFraisGeneraux] = useState("");
  const [taxePct, setTaxePct] = useState("0");

  // Quand on ouvre une simulation enregistrée, on ne veut PAS que le
  // préremplissage joueur écrase les chiffres chargés.
  const skipPrefill = useRef(false);

  // Préremplissage selon le client : joueur → salaire annuel (M€→€) ; club → valeur de transfert (M€→€)
  useEffect(() => {
    if (skipPrefill.current) { skipPrefill.current = false; return; }
    if (!player) return;
    if (client === "joueur") {
      if (player.salaire) setBase(String(Math.round(player.salaire * 1_000_000)));
      if (player.age != null) setAnnees("1");
    } else if (player.valeur_marchande) {
      setBase(String(Math.round(player.valeur_marchande * 1_000_000)));
    }
  }, [player?.id, client]);

  const baseLabel = client === "joueur"
    ? "Rémunération brute du joueur (salaire × durée + signing)"
    : "Indemnité de transfert";

  const res = useMemo(() => {
    const mult = client === "joueur" ? Math.max(1, toNum(annees) || 1) : 1;
    const baseGar = toNum(base) * mult;            // rémunération GARANTIE
    const ff = toNum(forfait);
    if (!baseGar && !ff) return null;
    const rate = toNum(taux) / 100;
    const bonusVal = toNum(bonus);
    const probaR = Math.min(1, Math.max(0, (toNum(proba) || 0) / 100));
    const pct = splitActif === "oui" ? toNum(partAgent) / 100 : 1;
    // Garantie (sûr) · Espérée (pondérée par la proba) · Potentielle (tous bonus atteints)
    const commGar = commissionAgent({ base: baseGar, taux: rate, forfait: ff });
    const commEsp = commissionAgent({ base: baseGar + bonusVal * probaR, taux: rate, forfait: ff });
    const commPot = commissionAgent({ base: baseGar + bonusVal, taux: rate, forfait: ff });
    const partGar = splitAgent(commGar, pct);
    const partEsp = splitAgent(commEsp, pct);
    const partPot = splitAgent(commPot, pct);
    // Profit net agence = part encaissée − frais généraux − taxes/TVA (cahier §6.2).
    const frais = toNum(fraisGeneraux);
    const taxeR = Math.max(0, toNum(taxePct) / 100);
    const profitNetGar = partGar - frais - partGar * taxeR;
    const profitNetEsp = partEsp - frais - partEsp * taxeR;
    return {
      baseGar, bonusVal, commGar, commEsp, commPot,
      partGar, partEsp, partPot,
      partAutreGar: splitAgent(commGar, 1 - pct),
      frais, profitNetGar, profitNetEsp,
    };
  }, [client, base, annees, taux, forfait, bonus, proba, splitActif, partAgent, fraisGeneraux, taxePct]);

  const inputs = { client, base, annees, taux, forfait, bonus, proba, splitActif, partAgent, fraisGeneraux, taxePct };
  const handleLoad = (o) => {
    if (!o || typeof o !== "object") return;
    // Arme le skip uniquement si le client change (sinon l'effet ne se relance pas).
    if ((o.client ?? "joueur") !== client) skipPrefill.current = true;
    setClient(o.client ?? "joueur");
    setBase(o.base ?? "");
    setAnnees(o.annees ?? "1");
    setTaux(o.taux ?? "5");
    setForfait(o.forfait ?? "");
    setBonus(o.bonus ?? "");
    setProba(o.proba ?? "50");
    setSplitActif(o.splitActif ?? "non");
    setPartAgent(o.partAgent ?? "70");
    setFraisGeneraux(o.fraisGeneraux ?? "");
    setTaxePct(o.taxePct ?? "0");
  };
  const resume = res
    ? `Commission ${fmtEUR(res.partGar)} garantie${res.bonusVal > 0 ? ` · ${fmtEUR(res.partPot)} max` : ""}`
    : "";

  return (
    <div className="space-y-4">
      <SaveBar
        module="commission"
        inputs={inputs}
        resume={resume}
        playerId={player?.id}
        playerName={player?.nom}
        onLoad={handleLoad}
        canSave={!!res}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs text-slate-500 mb-1 block">Client de l'agent</Label>
          <Select value={client} onValueChange={setClient}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="joueur">Joueur — base = contrat joueur</SelectItem>
              <SelectItem value="club_acheteur">Club acheteur — base = transfert ou salaire</SelectItem>
              <SelectItem value="club_vendeur">Club vendeur — base = indemnité de transfert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <NumField label={baseLabel} value={base} onChange={setBase} placeholder="250000" />
        {client === "joueur" && (
          <NumField label="Durée du contrat" value={annees} onChange={setAnnees} placeholder="3" suffix="ans" />
        )}
        <NumField label="Taux de commission" value={taux} onChange={setTaux} placeholder="5" suffix="%" />
        <NumField label="Forfait fixe (optionnel)" value={forfait} onChange={setForfait} placeholder="0" />
        <NumField label="Bonus conditionnel (optionnel)" value={bonus} onChange={setBonus} placeholder="0" />
        <NumField label="Probabilité du bonus" value={proba} onChange={setProba} placeholder="50" suffix="%" />

        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Partage avec un autre agent ?</Label>
          <Select value={splitActif} onValueChange={setSplitActif}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="non">Non</SelectItem>
              <SelectItem value="oui">Oui (split agent-agent)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {splitActif === "oui" && (
          <NumField label="Part de cet agent" value={partAgent} onChange={setPartAgent} placeholder="70" suffix="%" />
        )}
        <NumField label="Frais généraux agence (voyages, scouting…)" value={fraisGeneraux} onChange={setFraisGeneraux} placeholder="0" />
        <NumField label="Taxes / TVA agence" value={taxePct} onChange={setTaxePct} placeholder="0" suffix="%" />
      </div>

      {res && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className={`grid gap-3 ${res.bonusVal > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
            <Stat
              label={splitActif === "oui" ? "Garantie (cet agent)" : "Commission garantie"}
              value={fmtEUR(res.partGar)}
              color="text-green-600"
              sub={splitActif === "oui" ? `autre agent : ${fmtEUR(res.partAutreGar)}` : `base sûre ${fmtEUR(res.baseGar)}`}
            />
            {res.bonusVal > 0 && (
              <Stat label="Espérée (pondérée)" value={fmtEUR(res.partEsp)} color="text-blue-600" sub={`bonus × ${toNum(proba)}%`} />
            )}
            {res.bonusVal > 0 && (
              <Stat label="Potentielle (max)" value={fmtEUR(res.partPot)} color="text-slate-900" sub="tous bonus atteints" />
            )}
          </div>

          {(res.frais > 0 || toNum(taxePct) > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Profit net agence (garanti)" value={fmtEUR(res.profitNetGar)} color="text-indigo-700" sub={`après frais ${fmtEUR(res.frais)}${toNum(taxePct) > 0 ? ` + taxes ${toNum(taxePct)}%` : ""}`} />
              {res.bonusVal > 0 && <Stat label="Profit net (espéré)" value={fmtEUR(res.profitNetEsp)} color="text-indigo-700" />}
            </div>
          )}

          <div className="flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              La base de calcul dépend du client : commission <b>joueur</b> = % du contrat ; commission <b>club vendeur</b> = % du transfert.
              Ne pas mélanger les bases. TVA et impôt société sont des couches séparées (non incluses ici).
            </span>
          </div>
        </div>
      )}

      {!res && (
        <div className="flex items-center gap-2 text-sm text-slate-400 justify-center py-6">
          <Briefcase className="w-4 h-4" /> Saisissez une base et un taux pour calculer la commission.
        </div>
      )}
    </div>
  );
}
