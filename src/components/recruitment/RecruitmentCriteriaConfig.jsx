import React, { useState } from "react";
import {
  getCriteriaConfig, setCriteriaConfig, resetCriteriaConfig,
  getTargetProfile, setTargetProfile,
  getBandsConfig, setBandsConfig, resetBandsConfig,
} from "@/lib/recruitmentScoring";
import { useRecruitmentConfig } from "@/lib/useRecruitmentConfig";
import { Plus, Trash2, RotateCcw, Save, Sliders } from "lucide-react";

// Réglage par utilisateur : activer/désactiver des critères, les pondérer,
// en ajouter, fixer les barèmes (bornes des notes), et définir un profil cible.
export default function RecruitmentCriteriaConfig({ onSaved }) {
  const [list, setList] = useState(() => getCriteriaConfig());
  const [target, setTarget] = useState(() => getTargetProfile());
  const [bands, setBands] = useState(() => getBandsConfig());
  const [saved, setSaved] = useState(false);
  const { save: saveOrg } = useRecruitmentConfig();

  const upd = (key, patch) => setList((l) => l.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  const addCustom = () => setList((l) => [...l, { key: "c_" + Date.now(), label: "Nouveau critère", hint: "Faible / Moyen / Bon / Excellent", custom: true, enabled: true, weight: 1 }]);
  const removeCustom = (key) => setList((l) => l.filter((c) => c.key !== key));
  const setT = (k) => (e) => setTarget((t) => ({ ...t, [k]: e.target.value }));
  const updBand = (k, t) => setBands((b) => ({ ...b, [k]: { ...b[k], t } }));

  const save = () => {
    setCriteriaConfig(list);
    setTargetProfile(target);
    setBandsConfig(bands);
    saveOrg.mutate();                 // persistance partagée par organisation (Base44)
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    onSaved?.();
  };
  const reset = () => {
    resetCriteriaConfig(); resetBandsConfig();
    setList(getCriteriaConfig()); setBands(getBandsConfig());
    saveOrg.mutate();
  };

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
        <h4 className="font-semibold text-sm text-slate-700 mb-1 flex items-center gap-1.5"><Sliders className="w-4 h-4 text-slate-400" /> Barèmes des notes (bornes des 4 paliers)</h4>
        <p className="text-[11px] text-slate-500 mb-2">Déplace les bornes de chaque critère chiffré. Les valeurs par défaut reprennent le barème actuel.</p>
        <div className="space-y-2">
          {Object.entries(bands).map(([k, band]) => <BandRow key={k} bandKey={k} band={band} onChange={updBand} />)}
        </div>
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

// Éditeur des bornes d'un critère chiffré (4 paliers : note 3/2/1/0).
function BandRow({ bandKey, band, onChange }) {
  const arrow = band.dir === "asc" ? "≥" : "≤";
  const sens = band.dir === "asc" ? "plus haut = meilleure note" : "plus bas = meilleure note";
  const set = (i, v) => { const t = [...band.t]; t[i] = v === "" ? "" : Number(v); onChange(bandKey, t); };
  const nums = band.t.map(Number);
  // Cohérence : desc → bornes croissantes ; asc → bornes décroissantes.
  const ordered = band.dir === "asc"
    ? nums[0] >= nums[1] && nums[1] >= nums[2]
    : nums[0] <= nums[1] && nums[1] <= nums[2];
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-700 font-medium">{band.label}</span>
        <span className="text-[11px] text-slate-400">{band.unit} · {sens}</span>
      </div>
      <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-xs text-slate-500">
        {[0, 1, 2].map((i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <b className="text-slate-700">note {3 - i}</b> si {arrow}
            <input type="number" step={band.step} value={band.t[i]} onChange={(e) => set(i, e.target.value)}
              className="w-16 border border-slate-200 rounded px-1.5 py-0.5 text-right" />
            <span className="text-slate-300">·</span>
          </span>
        ))}
        <span>sinon <b className="text-slate-700">note 0</b></span>
      </div>
      {!ordered && <p className="text-[11px] text-amber-600 mt-1">⚠️ Bornes incohérentes pour ce sens — vérifie l'ordre.</p>}
    </div>
  );
}
