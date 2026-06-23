import React, { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft, Info } from "lucide-react";
import { coutTransfert, solidarite, netVendeur, fmtM, toNum } from "../../../lib/transferCalc";

// Saisie en millions d'euros (convention de l'app)
const MField = ({ label, value, onChange, placeholder, suffix = "M€" }) => (
  <div>
    <Label className="text-xs text-slate-500 mb-1 block">{label}</Label>
    <div className="relative">
      <Input type="number" min="0" step="0.1" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pr-12" />
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

export default function TransferFeeSimulator({ player }) {
  const [indemnite, setIndemnite] = useState("");
  const [bonus, setBonus] = useState("");
  const [tauxSolidarite, setTauxSolidarite] = useState("5");
  const [commissionVendeurPct, setCommissionVendeurPct] = useState("");
  const [autresDeductions, setAutresDeductions] = useState("");

  // Préremplissage : indemnité = valeur marchande du joueur (déjà en M€)
  useEffect(() => {
    if (player?.valeur_marchande) setIndemnite(String(player.valeur_marchande));
  }, [player?.id]);

  const res = useMemo(() => {
    const fixe = toNum(indemnite);
    if (!fixe && !toNum(bonus)) return null;
    const coutAcheteur = coutTransfert({ indemniteFixe: fixe, bonus: toNum(bonus) });
    // Base solidarité = compensation de transfert (indemnité + bonus déclenchés)
    const solidariteVal = solidarite(coutAcheteur, toNum(tauxSolidarite) / 100);
    const commVendeur = coutAcheteur * (toNum(commissionVendeurPct) / 100);
    const net = netVendeur({
      transfertPercu: coutAcheteur,
      solidariteMontant: solidariteVal,
      commissionAgentVendeur: commVendeur,
      autresDeductions: toNum(autresDeductions),
    });
    return { coutAcheteur, solidariteVal, commVendeur, net };
  }, [indemnite, bonus, tauxSolidarite, commissionVendeurPct, autresDeductions]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MField label="Indemnité de transfert (fixe)" value={indemnite} onChange={setIndemnite} placeholder="10" />
        <MField label="Bonus déclenchés" value={bonus} onChange={setBonus} placeholder="0" />
        <MField label="Taux de solidarité FIFA" value={tauxSolidarite} onChange={setTauxSolidarite} placeholder="5" suffix="%" />
        <MField label="Commission agent club vendeur" value={commissionVendeurPct} onChange={setCommissionVendeurPct} placeholder="0" suffix="%" />
        <MField label="Autres déductions" value={autresDeductions} onChange={setAutresDeductions} placeholder="0" />
      </div>

      {res && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Coût acheteur (volet transfert)" value={fmtM(res.coutAcheteur)} color="text-orange-600" sub="indemnité + bonus (hors salaire)" />
            <Stat label="Solidarité FIFA estimée" value={fmtM(res.solidariteVal)} color="text-slate-900" sub={`${toNum(tauxSolidarite)}% — Art. 21 / Annexe 5`} />
            <Stat label="Commission agent vendeur" value={fmtM(res.commVendeur)} color="text-slate-900" />
            <Stat label="Net encaissé club vendeur" value={fmtM(res.net)} color="text-green-600" sub="après solidarité, agent, déductions" />
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Solidarité estimée avant EPP (passeport électronique du joueur) ; le calcul final dépend des clubs formateurs (12-23 ans).
              Le coût TOTAL acheteur ajoute le salaire + charges + agents (voir module Salaire). Sell-on à venir.
            </span>
          </div>
        </div>
      )}

      {!res && (
        <div className="flex items-center gap-2 text-sm text-slate-400 justify-center py-6">
          <ArrowRightLeft className="w-4 h-4" /> Saisissez une indemnité de transfert pour lancer le calcul.
        </div>
      )}
    </div>
  );
}
