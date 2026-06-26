import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserCheck, Baby, Building2, ArrowRightLeft, ArrowLeft, Save, Search, CheckCircle2 } from "lucide-react";
import MajorPlayerForm from "../components/recruitment/MajorPlayerForm";
import MinorPlayerForm from "../components/recruitment/MinorPlayerForm";
import RecruitmentPipeline from "../components/recruitment/RecruitmentPipeline";
import ImportTransfermarkt from "../components/recruitment/ImportTransfermarkt";
import RecruitmentScoringConfig from "../components/recruitment/RecruitmentScoringConfig";
import ActivityLogList from "@/components/activity/ActivityLogList";
import { useRecruitment } from "../lib/useRecruitment";
import { caseToDealInputs } from "../lib/recruitmentScoring";

const PATHWAYS = [
  { id: "major", label: "Joueur majeur (18+)", icon: UserCheck, desc: "Sourcing Transfermarkt, fiche, scoring auto, contact.", accent: "border-blue-200 hover:border-blue-300" },
  { id: "minor", label: "Joueur mineur", icon: Baby, desc: "Saisie manuelle, live scouting, conformité renforcée.", accent: "border-amber-200 hover:border-amber-300" },
  { id: "club_need", label: "Besoin club", icon: Building2, desc: "Partir d'un besoin de poste puis chercher des profils.", accent: "border-green-200 hover:border-green-300" },
];

const safeParse = (s) => { try { return JSON.parse(s || "{}"); } catch { return {}; } };

export default function RecruitmentPage() {
  const { cases, save, remove } = useRecruitment();
  const navigate = useNavigate();
  const [tab, setTab] = useState("new");
  const [pathway, setPathway] = useState(null);
  const [editCase, setEditCase] = useState(null);
  const [savedMsg, setSavedMsg] = useState(null);

  const resetForm = () => { setPathway(null); setEditCase(null); };
  const handleSimulate = (c) => navigate(createPageUrl("TransferManagement"), { state: { dealPrefill: caseToDealInputs(c) } });
  const handleSave = (data) => {
    save.mutate(data, {
      onSuccess: () => {
        resetForm();
        setTab("new");
        setSavedMsg(data?.name || "Dossier enregistré");
        setTimeout(() => setSavedMsg(null), 5000);
      },
    });
  };
  const handleEdit = (c) => { setEditCase(c); setPathway(c.pathway); setTab("new"); };

  const initialForm = editCase ? safeParse(editCase.details) : null;
  const editId = editCase?.id || null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 flex items-center gap-2"><Search className="w-7 h-7" /> Recrutement</h1>
            <p className="text-slate-500 text-sm mt-0.5 hidden md:block">Identifier, qualifier, contacter et suivre des joueurs — avec scoring, conformité et CRM.</p>
          </div>
          <div className="flex-shrink-0"><RecruitmentScoringConfig /></div>
        </div>

        {savedMsg && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-2.5 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Enregistré : <b>{savedMsg}</b>
          </div>
        )}

        {tab === "new" && !pathway && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PATHWAYS.map((p) => (
                <button key={p.id} onClick={() => { setEditCase(null); setPathway(p.id); }} className={`text-left rounded-2xl border-2 bg-white p-5 transition-all shadow-sm ${p.accent}`}>
                  <p.icon className="w-7 h-7 text-slate-700 mb-2" />
                  <div className="font-semibold text-slate-900">{p.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{p.desc}</div>
                </button>
              ))}
            </div>
            <ImportTransfermarkt onImport={(rows) => rows.forEach((row) => save.mutate(row))} />
          </>
        )}

        {tab === "new" && pathway && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-4">
            <button onClick={resetForm} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> {editCase ? "Annuler l'édition" : "Changer de parcours"}</button>
            {pathway === "major" && <MajorPlayerForm initial={initialForm} editId={editId} onSave={handleSave} saving={save.isPending} />}
            {pathway === "minor" && <MinorPlayerForm initial={initialForm} editId={editId} onSave={handleSave} saving={save.isPending} />}
            {pathway === "club_need" && <ClubNeedForm initial={initialForm} editId={editId} onSave={handleSave} saving={save.isPending} />}
            {editCase && <ActivityLogList entityId={editCase.id} entityType="RecruitmentCase" />}
          </div>
        )}
      </div>
    </div>
  );
}

const tabCls = (active) =>
  `flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium transition-all text-sm ${
    active ? "bg-slate-900 text-white shadow-lg" : "text-slate-600 hover:text-slate-900"
  }`;

// Besoin club (V1 simple) — part du besoin de poste pour bâtir une shortlist.
// ⚠️ Module-level (identité stable) — défini DANS le composant, il remontait
// l'input à chaque frappe et faisait perdre le focus.
const ClubFld = ({ label, value, onChange, ph, span }) => (
  <div className={span ? "sm:col-span-2" : ""}>
    <Label className="text-[11px] text-slate-500 mb-1 block">{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} className="h-9" />
  </div>
);

function ClubNeedForm({ initial = null, editId = null, onSave, saving }) {
  const [f, setF] = useState({ club: "", country: "", poste: "", niveau: "", budget: "", notes: "", ...(initial || {}) });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => onSave?.({
    ...(editId ? { id: editId } : {}),
    pathway: "club_need", name: `Besoin ${f.poste || "poste"} — ${f.club || "club"}`,
    is_minor: false, club: f.club, country: f.country, positions: f.poste, division: f.niveau,
    status: "long_list", compliance_status: "green", next_action: "Constituer la shortlist de profils compatibles",
    details: JSON.stringify({ ...f }),
  });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <ClubFld label="Club cible" value={f.club} onChange={(v) => set("club", v)} ph="" />
        <ClubFld label="Pays" value={f.country} onChange={(v) => set("country", v)} ph="" />
        <ClubFld label="Poste recherché" value={f.poste} onChange={(v) => set("poste", v)} ph="Ailier droit" />
        <ClubFld label="Niveau visé" value={f.niveau} onChange={(v) => set("niveau", v)} ph="D1 / D2" />
        <ClubFld label="Budget salarial (M€/an)" value={f.budget} onChange={(v) => set("budget", v)} ph="" />
      </div>
      <div><Label className="text-[11px] text-slate-500 mb-1 block">Notes besoin</Label><Textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3} /></div>
      <div className="flex justify-end"><Button onClick={submit} disabled={saving || !f.club} className="gap-1.5"><Save className="w-4 h-4" /> {editId ? "Mettre à jour" : "Créer le besoin"}</Button></div>
    </div>
  );
}
