import React, { useState } from "react";
import {
  getCriteriaConfig, setCriteriaConfig, resetCriteriaConfig,
  getTargetProfile, setTargetProfile,
} from "@/lib/recruitmentScoring";
import { Plus, Trash2, RotateCcw, Save, Sliders } from "lucide-react";

// Réglage par utilisateur : activer/désactiver des critères, les pondérer,
// en ajouter, et définir un profil cible de recherche.
export default function RecruitmentCriteriaConfig({ onSaved }) {
  const [list, setList] = useState(() => getCriteriaConfig());
  const [target, setTarget] = useState(() => getTargetProfile());
  const [saved, setSaved] = useState(false);

  const upd = (key, patch) => setList((l) => l.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  const addCustom = () => setList((l) => [...l, { key: "c_" + Date.now(), label: "Nouveau critère", hint: "Faible / Moyen / Bon / Excellent", custom: true, enabled: true, weight: 1 }]);
  const removeCustom = (key) => setList((l) => l.filter((c) => c.key !== key));
  const setT = (k) => (e) => setTarget((t) => ({ ...t, [k]: e.target.value }));

  const save = () => {
    setCriteriaConfig(list);
    setTargetProfile(target);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    onSaved?.();
  };
  const reset = () => { resetCriteriaConfig(); setList(getCriteriaConfig()); };

  const max = list.filter((c) => c.enabled).reduce((s, c) => s + 3 * c.weight, 0);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-1.5"><Sliders className="w-4 h-4 text-slate-400" /> Critères de scoring</h4>
          <span className="text-xs text-slate-400">Score max : <b className="text-slate-600">{max}</b></span>
        </div>
        <div className="space-y-2">
          {list.map((c) => (
            <div key={c.key} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${c.enabled ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"}`}>
              <input type="checkbox" checked={c.enabled} onChange={(e) => upd(c.key, { enabled: e.target.checked })} className="w-4 h-4 accent-green-600 flex-shrink-0" />
              {c.custom
                ? <input value={c.label} onChange={(e) => upd(c.key, { label: e.target.value })} className="flex-1 min-w-0 text-sm border border-slate-200 rounded px-2 py-1" />
                : <span className="flex-1 min-w-0 text-sm text-slate-700 truncate">{c.label}</span>}
              <label className="text-[11px] text-slate-400 flex-shrink-0">Poids</label>
              <select value={c.weight} onChange={(e) => upd(c.key, { weight: Number(e.target.value) })} className="text-sm border border-slate-200 rounded px-1.5 py-1 flex-shrink-0">
                {[1, 2, 3, 4, 5].map((w) => <option key={w} value={w}>×{w}</option>)}
              </select>
              {c.custom && <button onClick={() => removeCustom(c.key)} className="text-slate-300 hover:text-red-500 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>}
            </div>
          ))}
        </div>
        <button onClick={addCustom} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-800"><Plus className="w-3.5 h-3.5" /> Ajouter un critère</button>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-slate-700 mb-2">Profil cible (recherche)</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <TF label="Poste" value={target.poste} onChange={setT("poste")} ph="RW, AM…" />
          <TF label="Âge min" value={target.ageMin} onChange={setT("ageMin")} ph="18" type="number" />
          <TF label="Âge max" value={target.ageMax} onChange={setT("ageMax")} ph="23" type="number" />
          <TF label="Niveau" value={target.niveau} onChange={setT("niveau")} ph="D1/D2…" />
          <TF label="Pays" value={target.pays} onChange={setT("pays")} ph="France…" />
          <TF label="Pied" value={target.pied} onChange={setT("pied")} ph="Gauche…" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg px-4 py-2 font-medium"><Save className="w-4 h-4" /> Enregistrer</button>
        <button onClick={reset} className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs"><RotateCcw className="w-3.5 h-3.5" /> Réinitialiser</button>
        {saved && <span className="text-sm text-green-600">Enregistré ✓</span>}
      </div>
    </div>
  );
}

const TF = ({ label, value, onChange, ph, type = "text" }) => (
  <div>
    <label className="text-[11px] text-slate-500 mb-0.5 block">{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={ph} className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5" />
  </div>
);
