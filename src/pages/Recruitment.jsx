import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserCheck, Baby, Building2, ArrowRightLeft, Columns, ArrowLeft, Save, Search } from "lucide-react";
import MajorPlayerForm from "../components/recruitment/MajorPlayerForm";
import MinorPlayerForm from "../components/recruitment/MinorPlayerForm";
import RecruitmentPipeline from "../components/recruitment/RecruitmentPipeline";
import { useRecruitment } from "../lib/useRecruitment";

const PATHWAYS = [
  { id: "major", label: "Joueur majeur (18+)", icon: UserCheck, desc: "Sourcing Transfermarkt, fiche, scoring auto, contact.", accent: "border-blue-200 hover:border-blue-300" },
  { id: "minor", label: "Joueur mineur", icon: Baby, desc: "Saisie manuelle, live scouting, conformité renforcée.", accent: "border-amber-200 hover:border-amber-300" },
  { id: "club_need", label: "Besoin club", icon: Building2, desc: "Partir d'un besoin de poste puis chercher des profils.", accent: "border-green-200 hover:border-green-300" },
];

export default function RecruitmentPage() {
  const { cases, save, remove } = useRecruitment();
  const [tab, setTab] = useState("new");
  const [pathway, setPathway] = useState(null);

  const handleSave = (data) => {
    save.mutate(data, { onSuccess: () => { setPathway(null); setTab("pipeline"); } });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 flex items-center gap-2"><Search className="w-7 h-7" /> Recrutement</h1>
            <p className="text-slate-500 text-sm mt-0.5 hidden md:block">Identifier, qualifier, contacter et suivre des joueurs — avec scoring, conformité et CRM.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1 flex gap-1">
          <button onClick={() => setTab("new")} className={tabCls(tab === "new")}><ArrowRightLeft className="w-4 h-4" /> Nouveau</button>
          <button onClick={() => setTab("pipeline")} className={tabCls(tab === "pipeline")}><Columns className="w-4 h-4" /> Pipeline ({cases.length})</button>
        </div>

        {tab === "pipeline" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6">
            <RecruitmentPipeline cases={cases} onDelete={(c) => remove.mutate(c)} />
          </div>
        )}

        {tab === "new" && !pathway && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PATHWAYS.map((p) => (
              <button key={p.id} onClick={() => setPathway(p.id)} className={`text-left rounded-2xl border-2 bg-white p-5 transition-all shadow-sm ${p.accent}`}>
                <p.icon className="w-7 h-7 text-slate-700 mb-2" />
                <div className="font-semibold text-slate-900">{p.label}</div>
                <div className="text-xs text-slate-500 mt-1">{p.desc}</div>
              </button>
            ))}
          </div>
        )}

        {tab === "new" && pathway && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-4">
            <button onClick={() => setPathway(null)} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> Changer de parcours</button>
            {pathway === "major" && <MajorPlayerForm onSave={handleSave} saving={save.isPending} />}
            {pathway === "minor" && <MinorPlayerForm onSave={handleSave} saving={save.isPending} />}
            {pathway === "club_need" && <ClubNeedForm onSave={handleSave} saving={save.isPending} />}
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
function ClubNeedForm({ onSave, saving }) {
  const [f, setF] = useState({ club: "", country: "", poste: "", niveau: "", budget: "", notes: "" });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => onSave?.({
    pathway: "club_need", name: `Besoin ${f.poste || "poste"} — ${f.club || "club"}`,
    is_minor: false, club: f.club, country: f.country, positions: f.poste, division: f.niveau,
    status: "long_list", compliance_status: "green", next_action: "Constituer la shortlist de profils compatibles",
    details: JSON.stringify({ budget: f.budget, notes: f.notes }),
  });
  const Fld = ({ label, k, ph, span }) => (
    <div className={span ? "sm:col-span-2" : ""}><Label className="text-[11px] text-slate-500 mb-1 block">{label}</Label>
      <Input value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} className="h-9" /></div>
  );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Fld label="Club cible" k="club" ph="" />
        <Fld label="Pays" k="country" ph="" />
        <Fld label="Poste recherché" k="poste" ph="Ailier droit" />
        <Fld label="Niveau visé" k="niveau" ph="D1 / D2" />
        <Fld label="Budget salarial (M€/an)" k="budget" ph="" />
      </div>
      <div><Label className="text-[11px] text-slate-500 mb-1 block">Notes besoin</Label><Textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3} /></div>
      <div className="flex justify-end"><Button onClick={submit} disabled={saving || !f.club} className="gap-1.5"><Save className="w-4 h-4" /> Créer le besoin</Button></div>
    </div>
  );
}
