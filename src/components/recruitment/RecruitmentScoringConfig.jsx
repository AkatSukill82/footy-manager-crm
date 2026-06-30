import React, { useState } from "react";
import { getTiers, setTiers, resetTiers, currentScoreMax } from "@/lib/recruitmentScoring";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

/**
 * Configuration des SEUILS de décision du scoring recrutement (§8/§19).
 * Le score max est DYNAMIQUE (dépend des critères actifs et de leurs poids) :
 * les seuils Priorité/Contact/Veille s'expriment sur cette échelle courante
 * (stockés en localStorage, lus par scoreTier/deriveStatus).
 */
function Row({ label, value, onChange, max }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-600">{label}</span>
      <input type="number" min="0" max={max} value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
        className="w-16 border border-slate-200 rounded px-2 py-1 text-right" />
    </div>
  );
}

export default function RecruitmentScoringConfig() {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState(getTiers);
  const max = currentScoreMax();
  const save = (next) => { setT(next); setTiers(next); };
  const reset = () => { resetTiers(); setT(getTiers()); };
  const incoherent = t.watch >= t.contact || t.contact >= t.priority;

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
        <SlidersHorizontal className="w-3.5 h-3.5" /> Seuils de scoring
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs space-y-2">
          <p className="text-slate-500">Score sur <b>{max}</b> — seuils de décision :</p>
          <Row max={max} label="🟢 Priorité A  ≥" value={t.priority} onChange={(v) => save({ ...t, priority: v })} />
          <Row max={max} label="🔵 Contact  ≥" value={t.contact} onChange={(v) => save({ ...t, contact: v })} />
          <Row max={max} label="🟠 Veille  ≥" value={t.watch} onChange={(v) => save({ ...t, watch: v })} />
          <p className="text-slate-400">En dessous de {t.watch} → Abandon.</p>
          {incoherent && <p className="text-red-500">⚠️ Ordre à respecter : Veille &lt; Contact &lt; Priorité.</p>}
          <button onClick={reset} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 pt-1">
            <RotateCcw className="w-3 h-3" /> Réinitialiser (16 / 13 / 9)
          </button>
        </div>
      )}
    </div>
  );
}
