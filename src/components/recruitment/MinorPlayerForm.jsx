import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, Save, Info } from "lucide-react";
import { MINOR_CRITERIA, scoreMinor, deriveStatus } from "@/lib/recruitmentScoring";

const F = ({ label, children, span }) => (
  <div className={span ? "sm:col-span-2" : ""}><Label className="text-[11px] text-slate-500 mb-1 block">{label}</Label>{children}</div>
);
const Txt = ({ label, value, onChange, ph, span }) => (
  <F label={label} span={span}><Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} className="h-9" /></F>
);
const Sel = ({ label, value, onChange, options }) => (
  <F label={label}><Select value={value} onValueChange={onChange}>
    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
    <SelectContent>{options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
  </Select></F>
);
const NOTE_OPTS = [{ v: "0", l: "0" }, { v: "1", l: "1" }, { v: "2", l: "2" }, { v: "3", l: "3" }];
const Section = ({ title, children, cols = "md:grid-cols-3" }) => (
  <div className="rounded-xl border border-slate-200 p-3 space-y-3">
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</div>
    <div className={`grid grid-cols-2 ${cols} gap-3`}>{children}</div>
  </div>
);

export default function MinorPlayerForm({ initial = null, editId = null, onSave, saving }) {
  const [f, setF] = useState(() => ({
    name: "", age: "", nationalite: "", ville: "", club: "", categorie: "", coach: "", championnat: "",
    positions: "", pied: "", taille: "", qualites: "", axes: "",
    match_date: "", adversaire: "", duree: "", niveau_opp: "", notes: "",
    video: "",
    legal_guardian_status: "unknown", contact_autorise: "non", language: "FR",
    fifa_agent_validated: false, country_rules_checked: false, restrictions: "", next_obs: "",
    live: "0", technique: "1", physique: "1", mental: "1", progression: "1", contexte: "0",
    owner: "", next_action: "Planifier une nouvelle observation live",
    ...(initial || {}),
  }));
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const r = useMemo(() => {
    const { total, breakdown } = scoreMinor(f);
    const liveSeen = Number(f.live) > 0;
    const reqOk = liveSeen && f.legal_guardian_status !== "unknown" && f.fifa_agent_validated && f.country_rules_checked;
    const status = deriveStatus({ is_minor: true, score: total, minor_requirements_ok: reqOk });
    return { total, breakdown, reqOk, status, liveSeen };
  }, [f]);

  const handleSave = () => {
    onSave?.({
      ...(editId ? { id: editId } : {}),
      pathway: "minor", name: f.name, is_minor: true, age: Number(f.age) || null,
      positions: f.positions, club: f.club, country: f.ville, division: f.categorie,
      legal_guardian_status: f.legal_guardian_status, fifa_agent_validated: !!f.fifa_agent_validated,
      live_seen: Number(f.live) || 0, language: f.language,
      score: r.total, score_breakdown: JSON.stringify(r.breakdown), compliance_status: "red",
      status: r.status, owner: f.owner, next_action: f.next_action, next_action_date: f.next_action_date || "",
      details: JSON.stringify({ ...f }), // état complet du formulaire → édition round-trip
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 border rounded-lg px-3 py-2 text-xs bg-red-50 border-red-200 text-red-800">
        <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span><b>Joueur mineur = workflow manuel + validation obligatoire.</b> Le contact direct est bloqué. On prépare une fiche et on recommande une observation — jamais d'approche directe non validée (agent FIFA + représentant légal).</span>
      </div>

      <Section title="Identité">
        <Txt label="Nom" value={f.name} onChange={(v) => set("name", v)} ph="Nom Prénom" />
        <Txt label="Âge" value={f.age} onChange={(v) => set("age", v)} ph="16" />
        <Txt label="Nationalité" value={f.nationalite} onChange={(v) => set("nationalite", v)} ph="" />
        <Txt label="Ville / pays" value={f.ville} onChange={(v) => set("ville", v)} ph="" />
      </Section>

      <Section title="Environnement">
        <Txt label="Club / académie" value={f.club} onChange={(v) => set("club", v)} ph="" />
        <Txt label="Catégorie" value={f.categorie} onChange={(v) => set("categorie", v)} ph="U17" />
        <Txt label="Entraîneur connu" value={f.coach} onChange={(v) => set("coach", v)} ph="" />
        <Txt label="Championnat / tournoi" value={f.championnat} onChange={(v) => set("championnat", v)} ph="" span />
      </Section>

      <Section title="Football">
        <Txt label="Poste(s)" value={f.positions} onChange={(v) => set("positions", v)} ph="Ailier" />
        <Txt label="Pied fort" value={f.pied} onChange={(v) => set("pied", v)} ph="" />
        <Txt label="Taille / physique" value={f.taille} onChange={(v) => set("taille", v)} ph="" />
        <Txt label="Qualités dominantes" value={f.qualites} onChange={(v) => set("qualites", v)} ph="" span />
        <Txt label="Axes de travail" value={f.axes} onChange={(v) => set("axes", v)} ph="" />
      </Section>

      <Section title="Observation live (base du jugement)">
        <F label="Date du match"><Input type="date" value={f.match_date} onChange={(e) => set("match_date", e.target.value)} className="h-9" /></F>
        <Txt label="Adversaire" value={f.adversaire} onChange={(v) => set("adversaire", v)} ph="" />
        <Txt label="Durée observée" value={f.duree} onChange={(v) => set("duree", v)} ph="90 min" />
        <Txt label="Niveau opposition" value={f.niveau_opp} onChange={(v) => set("niveau_opp", v)} ph="" />
        <div className="sm:col-span-3"><F label="Notes (technique / tactique / physique / mental)"><Textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} /></F></div>
        <Txt label="Lien vidéo" value={f.video} onChange={(v) => set("video", v)} ph="https://" span />
      </Section>

      <Section title="Entourage & conformité" cols="md:grid-cols-4">
        <Sel label="Représentant légal" value={f.legal_guardian_status} onChange={(v) => set("legal_guardian_status", v)} options={[{ v: "unknown", l: "Non identifié" }, { v: "identified", l: "Identifié" }, { v: "contact_authorized", l: "Contact autorisé" }]} />
        <Sel label="Contact autorisé ?" value={f.contact_autorise} onChange={(v) => set("contact_autorise", v)} options={[{ v: "non", l: "Non" }, { v: "oui", l: "Oui" }]} />
        <Sel label="Validé par agent FIFA ?" value={f.fifa_agent_validated ? "1" : "0"} onChange={(v) => set("fifa_agent_validated", v === "1")} options={[{ v: "0", l: "Non" }, { v: "1", l: "Oui" }]} />
        <Sel label="Règles pays vérifiées ?" value={f.country_rules_checked ? "1" : "0"} onChange={(v) => set("country_rules_checked", v === "1")} options={[{ v: "0", l: "Non" }, { v: "1", l: "Oui" }]} />
        <Txt label="Restrictions pays" value={f.restrictions} onChange={(v) => set("restrictions", v)} ph="" />
        <Txt label="Prochaine observation" value={f.next_obs} onChange={(v) => set("next_obs", v)} ph="" />
      </Section>

      <Section title="Scoring indicatif (manuel, 0-3)" cols="md:grid-cols-6">
        {MINOR_CRITERIA.map((c) => <Sel key={c.key} label={c.label} value={f[c.key]} onChange={(v) => set(c.key, v)} options={NOTE_OPTS} />)}
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Score suivi (indicatif)</div>
          <div className="text-2xl font-bold text-slate-900">{r.total}<span className="text-base text-slate-400"> / 18</span></div>
          <div className="text-xs font-semibold mt-1 text-orange-600">{r.status === "monitor_high" ? "Monitor + (priorité)" : "Monitor"}</div>
        </div>
        <div className="rounded-xl border p-4 bg-amber-50 border-amber-200 text-amber-800 md:col-span-2">
          <div className="flex items-center gap-2 font-semibold mb-1"><Info className="w-4 h-4" /> Conditions priorité haute</div>
          <ul className="text-xs space-y-0.5 list-disc list-inside">
            <li>{r.liveSeen ? "✅" : "⬜"} Vu en live au moins une fois</li>
            <li>{f.legal_guardian_status !== "unknown" ? "✅" : "⬜"} Représentant légal identifié</li>
            <li>{f.fifa_agent_validated ? "✅" : "⬜"} Validation agent FIFA</li>
            <li>{f.country_rules_checked ? "✅" : "⬜"} Règles du pays vérifiées</li>
          </ul>
          <div className="text-[11px] mt-2">Score ≥ 14 + ces 4 conditions → Monitor +. Sinon Monitor. Décision lente (3-6 mois).</div>
        </div>
      </div>

      <Section title="Suivi CRM" cols="md:grid-cols-2">
        <Txt label="Responsable" value={f.owner} onChange={(v) => set("owner", v)} ph="" />
        <Txt label="Prochaine action" value={f.next_action} onChange={(v) => set("next_action", v)} ph="" />
      </Section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !f.name} className="gap-1.5"><Save className="w-4 h-4" /> Enregistrer la fiche mineur</Button>
      </div>
    </div>
  );
}
