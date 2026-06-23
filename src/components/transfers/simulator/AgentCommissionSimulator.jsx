import React, { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, AlertTriangle } from "lucide-react";
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
  // Split éventuel avec un second agent (apporteur, co-mandat…)
  const [splitActif, setSplitActif] = useState("non");
  const [partAgent, setPartAgent] = useState("70");

  // Préremplissage selon le client : joueur → salaire annuel (M€→€) ; club → valeur de transfert (M€→€)
  useEffect(() => {
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
    const baseVal = toNum(base) * (client === "joueur" ? Math.max(1, toNum(annees) || 1) : 1);
    if (!baseVal && !toNum(forfait)) return null;
    const commission = commissionAgent({ base: baseVal, taux: toNum(taux) / 100, forfait: toNum(forfait) });
    const pct = splitActif === "oui" ? toNum(partAgent) / 100 : 1;
    return {
      baseVal,
      commission,
      partCetAgent: splitAgent(commission, pct),
      partAutreAgent: splitAgent(commission, 1 - pct),
    };
  }, [client, base, annees, taux, forfait, splitActif, partAgent]);

  return (
    <div className="space-y-4">
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
      </div>

      {res && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Commission brute totale" value={fmtEUR(res.commission)} color="text-slate-900" sub={`base ${fmtEUR(res.baseVal)} × ${toNum(taux)}%`} />
            <Stat
              label={splitActif === "oui" ? "Part de cet agent" : "Revenu de l'agent"}
              value={fmtEUR(res.partCetAgent)}
              color="text-green-600"
              sub={splitActif === "oui" ? `autre agent : ${fmtEUR(res.partAutreAgent)}` : undefined}
            />
          </div>

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
