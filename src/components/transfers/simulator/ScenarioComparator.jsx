import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileDown, FileSpreadsheet, GitCompare } from "lucide-react";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";
import SaveBar from "./SaveBar";
import { PAYS_CODES, getTaxProfile } from "../../../lib/taxProfiles";
import {
  netFromBrut, coutEmployeur, solidarite, netVendeur, fmtEUR, toNum,
} from "../../../lib/transferCalc";

// Calcule les 4 résultats clés d'un scénario (cours FIFA p.23).
function computeScenario(s) {
  const profil = getTaxProfile(s.pays) || { tauxSalarie: 0.45, tauxPatronal: 0.3 };
  const transfert = toNum(s.transfert);
  const salaire = toNum(s.salaire);
  const annees = Math.max(1, toNum(s.annees) || 1);
  const tjAg = toNum(s.tauxAgentJoueur) / 100;
  const tvAg = toNum(s.tauxAgentVendeur) / 100;

  const netJoueurAn = netFromBrut(salaire, profil.tauxSalarie);
  const coutSalaireAn = coutEmployeur({ brut: salaire, tauxPatronal: profil.tauxPatronal });
  const agentJoueurFee = salaire * annees * tjAg;
  const agentVendeurFee = transfert * tvAg;
  const solid = solidarite(transfert);
  const coutAcheteur = transfert + coutSalaireAn * annees + agentJoueurFee;
  const netVend = netVendeur({ transfertPercu: transfert, solidariteMontant: solid, commissionAgentVendeur: agentVendeurFee });
  const commissionAgence = agentJoueurFee + agentVendeurFee;

  return { netJoueurAn, coutAcheteur, netVend, commissionAgence };
}

const ROWS = [
  { key: "netJoueurAn",     label: "Net joueur / an",        color: "text-green-700" },
  { key: "coutAcheteur",    label: "Coût total club acheteur", color: "text-orange-700" },
  { key: "netVend",         label: "Net club vendeur",       color: "text-blue-700" },
  { key: "commissionAgence",label: "Commission agence",      color: "text-indigo-700" },
];

const emptyScenario = (n) => ({
  nom: `Scénario ${n}`, transfert: "", salaire: "", annees: "3", pays: "FR",
  tauxAgentJoueur: "5", tauxAgentVendeur: "10",
});

export default function ScenarioComparator() {
  const [scenarios, setScenarios] = useState([emptyScenario(1), emptyScenario(2)]);

  const setField = (i, key, val) => setScenarios((s) => s.map((sc, idx) => (idx === i ? { ...sc, [key]: val } : sc)));
  const addScenario = () => setScenarios((s) => s.length < 4 ? [...s, emptyScenario(s.length + 1)] : s);
  const delScenario = (i) => setScenarios((s) => s.length > 1 ? s.filter((_, idx) => idx !== i) : s);

  const results = useMemo(() => scenarios.map(computeScenario), [scenarios]);

  const exportExcel = () => {
    const aoa = [["Indicateur", ...scenarios.map((s) => s.nom)]];
    ROWS.forEach((r) => aoa.push([r.label, ...results.map((res) => Math.round(res[r.key]))]));
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scénarios");
    XLSX.writeFile(wb, "Simulateur_scenarios.xlsx");
  };

  const exportPDF = () => {
    const head = `<th>Indicateur</th>${scenarios.map((s) => `<th>${s.nom}</th>`).join("")}`;
    const body = ROWS.map((r) =>
      `<tr><td class="lbl">${r.label}</td>${results.map((res) => `<td>${fmtEUR(res[r.key])}</td>`).join("")}</tr>`
    ).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Scénarios de transfert</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;color:#1e293b}h1{font-size:20px}
      table{border-collapse:collapse;width:100%;margin-top:16px}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:right;font-size:13px}
      th{background:#2563eb;color:#fff}th:first-child,td.lbl{text-align:left}tr:nth-child(even) td{background:#f8fafc}
      .foot{margin-top:24px;font-size:10px;color:#94a3b8}</style></head><body>
      <h1>Comparaison de scénarios — transfert</h1>
      <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
      <p class="foot">Estimations (cours FIFA ProPulse) — à valider par un juriste/fiscaliste. Généré le ${new Date().toLocaleDateString("fr-FR")}.</p>
      <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html); w.document.close();
  };

  const filled = scenarios.some((s) => toNum(s.transfert) || toNum(s.salaire));

  const resume = `${scenarios.length} scénario${scenarios.length > 1 ? "s" : ""}` +
    (filled ? ` · ${scenarios.map((s) => s.nom).filter(Boolean).slice(0, 2).join(" / ")}` : "");
  const handleLoad = (o) => {
    if (Array.isArray(o?.scenarios) && o.scenarios.length) setScenarios(o.scenarios);
  };

  return (
    <div className="space-y-4">
      <SaveBar
        module="scenarios"
        inputs={{ scenarios }}
        resume={resume}
        onLoad={handleLoad}
        canSave={filled}
      />

      {/* Saisie des scénarios */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${scenarios.length}, minmax(0,1fr))` }}>
        {scenarios.map((s, i) => (
          <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1">
              <Input value={s.nom} onChange={(e) => setField(i, "nom", e.target.value)} className="h-8 text-sm font-semibold" />
              {scenarios.length > 1 && (
                <button onClick={() => delScenario(i)} className="p-1.5 rounded text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              )}
            </div>
            <Field label="Transfert (€)" value={s.transfert} onChange={(v) => setField(i, "transfert", v)} ph="1000000" />
            <Field label="Salaire brut/an (€)" value={s.salaire} onChange={(v) => setField(i, "salaire", v)} ph="300000" />
            <Field label="Durée (ans)" value={s.annees} onChange={(v) => setField(i, "annees", v)} ph="3" />
            <div>
              <Label className="text-[11px] text-slate-500">Pays (fiscalité)</Label>
              <Select value={s.pays} onValueChange={(v) => setField(i, "pays", v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{PAYS_CODES.map((c) => { const p = getTaxProfile(c); return <SelectItem key={c} value={c}>{p.drapeau} {p.nom}</SelectItem>; })}</SelectContent>
              </Select>
            </div>
            <Field label="Taux agent joueur (%)" value={s.tauxAgentJoueur} onChange={(v) => setField(i, "tauxAgentJoueur", v)} ph="5" />
            <Field label="Taux agent vendeur (%)" value={s.tauxAgentVendeur} onChange={(v) => setField(i, "tauxAgentVendeur", v)} ph="10" />
          </div>
        ))}
      </div>

      {scenarios.length < 4 && (
        <Button type="button" size="sm" variant="outline" onClick={addScenario} className="gap-1.5"><Plus className="w-4 h-4" /> Ajouter un scénario</Button>
      )}

      {/* Tableau comparatif */}
      {filled && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Indicateur</th>
                {scenarios.map((s, i) => <th key={i} className="text-right px-3 py-2 font-medium">{s.nom}</th>)}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.key} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-600">{r.label}</td>
                  {results.map((res, i) => <td key={i} className={`px-3 py-2 text-right font-semibold ${r.color}`}>{fmtEUR(res[r.key])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filled && (
        <div className="flex items-center gap-2">
          <Button onClick={exportPDF} size="sm" variant="outline" className="gap-1.5"><FileDown className="w-4 h-4" /> Export PDF</Button>
          <Button onClick={exportExcel} size="sm" variant="outline" className="gap-1.5"><FileSpreadsheet className="w-4 h-4" /> Export Excel</Button>
        </div>
      )}

      {!filled && (
        <div className="flex items-center gap-2 text-sm text-slate-400 justify-center py-6">
          <GitCompare className="w-4 h-4" /> Renseignez au moins un transfert ou un salaire pour comparer.
        </div>
      )}
    </div>
  );
}

const Field = ({ label, value, onChange, ph }) => (
  <div>
    <Label className="text-[11px] text-slate-500">{label}</Label>
    <Input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} className="h-8 text-sm" />
  </div>
);
