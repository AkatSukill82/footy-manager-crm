import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GraduationCap, Plus, Trash2, Info } from "lucide-react";
import { solidarityDistribution, fmtEUR, fmtPct, toNum } from "../../../lib/transferCalc";

/**
 * Training Rewards — répartition de la solidarité FIFA (Annexe 5) entre clubs
 * formateurs : 12-15 ans → 0,25 %/an, 16-23 ans → 0,50 %/an (total 5 %).
 */
export default function TrainingRewardsSimulator({ player }) {
  const [transfert, setTransfert] = useState("");
  const [periods, setPeriods] = useState([
    { club: "", ageDebut: "12", ageFin: "15" },
    { club: "", ageDebut: "16", ageFin: "19" },
  ]);

  const setRow = (i, key, val) => setPeriods((p) => p.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  const addRow = () => setPeriods((p) => [...p, { club: "", ageDebut: "", ageFin: "" }]);
  const delRow = (i) => setPeriods((p) => p.filter((_, idx) => idx !== i));

  const res = useMemo(() => {
    const base = toNum(transfert);
    if (!base) return null;
    return solidarityDistribution(base, periods.filter((r) => r.ageDebut !== "" && r.ageFin !== ""));
  }, [transfert, periods]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-slate-500 mb-1 block">Indemnité de transfert (base solidarité)</Label>
        <div className="relative">
          <Input type="number" min="0" value={transfert} onChange={(e) => setTransfert(e.target.value)} placeholder="1000000" className="pr-10" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-slate-500">Clubs formateurs (de 12 à 23 ans)</Label>
          <Button type="button" size="sm" variant="outline" onClick={addRow} className="h-7 text-xs gap-1"><Plus className="w-3.5 h-3.5" /> Club</Button>
        </div>
        <div className="space-y-2">
          {periods.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={r.club} onChange={(e) => setRow(i, "club", e.target.value)} placeholder="Club formateur" className="flex-1" />
              <Input type="number" min="12" max="23" value={r.ageDebut} onChange={(e) => setRow(i, "ageDebut", e.target.value)} placeholder="âge déb." className="w-20" />
              <span className="text-slate-300 text-xs">→</span>
              <Input type="number" min="12" max="23" value={r.ageFin} onChange={(e) => setRow(i, "ageFin", e.target.value)} placeholder="âge fin" className="w-20" />
              <button onClick={() => delRow(i)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      {res && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="text-left px-3 py-1.5 font-medium">Club formateur</th>
                  <th className="text-right px-3 py-1.5 font-medium">Part</th>
                  <th className="text-right px-3 py-1.5 font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                {res.rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-1.5 text-slate-700">{r.club}</td>
                    <td className="px-3 py-1.5 text-right text-slate-500">{fmtPct(r.rate)}</td>
                    <td className="px-3 py-1.5 text-right font-medium text-indigo-700">{fmtEUR(r.montant)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold">
                <tr className="border-t border-slate-200">
                  <td className="px-3 py-1.5 text-slate-700">Solidarité totale</td>
                  <td className="px-3 py-1.5 text-right text-slate-600">{fmtPct(res.totalRate)}</td>
                  <td className="px-3 py-1.5 text-right text-indigo-700">{fmtEUR(res.totalMontant)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {res.totalRate < 0.05 - 1e-9 && (
            <p className="text-[11px] text-amber-600">La solidarité plafonne à 5 % (12→23 ans). Ici {fmtPct(res.totalRate)} — l'historique 12-23 ans n'est pas complet.</p>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>Estimation (RSTP art. 21 / Annexe 5). La solidarité (5 %) est distribuée aux clubs formateurs ; à confirmer avec le passeport électronique du joueur (EPP). Ne pas confondre avec l'indemnité de formation (art. 20).</span>
      </div>
    </div>
  );
}
