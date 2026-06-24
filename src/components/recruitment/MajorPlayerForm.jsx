import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, ShieldAlert, ShieldCheck, AlertTriangle, Save, Wand2, Copy } from "lucide-react";
import {
  TM_LINKS, ageScore, contractScore, marketScore, scoreMajor, scoreTier,
  compliance, deriveStatus, canBeContactReady, generateMessage, canGenerateMessage, isOffensive,
} from "@/lib/recruitmentScoring";

const F = ({ label, children }) => (
  <div><Label className="text-[11px] text-slate-500 mb-1 block">{label}</Label>{children}</div>
);
const Num = ({ label, value, onChange, ph, suffix }) => (
  <F label={label}><div className="relative">
    <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} className={suffix ? "pr-10 h-9" : "h-9"} />
    {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>}
  </div></F>
);
const Txt = ({ label, value, onChange, ph }) => (
  <F label={label}><Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} className="h-9" /></F>
);
const Sel = ({ label, value, onChange, options }) => (
  <F label={label}><Select value={value} onValueChange={onChange}>
    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
    <SelectContent>{options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
  </Select></F>
);

const monthsUntil = (d) => {
  if (!d) return NaN;
  const end = new Date(d), now = new Date();
  if (isNaN(end.getTime())) return NaN;
  return (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
};

export default function MajorPlayerForm({ initial = null, onSave, saving }) {
  const [f, setF] = useState(() => ({
    name: "", age: "", positions: "", nationalite: "", taille: "", pied: "",
    club: "", country: "", division: "", contract_end: "", is_free: false, market_value: "",
    matches: "", minutes: "", goals: "", assists: "",
    level_note: "2", production_note: "2",
    agency_status: "unknown", agent_name: "", mandate_locked: false,
    nb_clubs: "", target_clubs: "",
    instagram: "", instagram_validated: false, fifa_agent_validated: false, language: "FR",
    owner: "", next_action: "Qualifier et identifier les clubs cibles", next_action_date: "",
    ...(initial || {}),
  }));
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const [message, setMessage] = useState(initial?.message_text || "");

  const age = Number(f.age) || 0;
  const isMinor = age > 0 && age < 18;
  const offensive = isOffensive(f.positions);

  const r = useMemo(() => {
    const agencyNote = f.mandate_locked ? 0 : f.agency_status === "none" ? 3 : f.agency_status === "small" ? 2 : f.agency_status === "large" ? 1 : 1;
    const notes = {
      age: ageScore(age),
      contract: contractScore(monthsUntil(f.contract_end), f.is_free),
      level: Number(f.level_note),
      production: Number(f.production_note),
      agency: agencyNote,
      market: marketScore(f.nb_clubs),
    };
    const { total, breakdown } = scoreMajor(notes);
    const tier = scoreTier(total);
    const incomplete = !f.name || !f.age || !f.club || !f.division || !f.positions;
    const comp = compliance({
      is_minor: isMinor, fifa_agent_validated: f.fifa_agent_validated, mandate_locked: f.mandate_locked,
      instagram: f.instagram, instagram_validated: f.instagram_validated,
      agency_status: f.agency_status, contract_long: monthsUntil(f.contract_end) > 24, incomplete,
    });
    const status = deriveStatus({ is_minor: isMinor, score: total, compliance_status: comp.level });
    const ready = canBeContactReady({
      is_minor: isMinor, compliance_status: comp.level, instagram_validated: f.instagram_validated,
      mandate_locked: f.mandate_locked, nb_clubs: f.nb_clubs, fifa_agent_validated: f.fifa_agent_validated,
    });
    return { total, breakdown, tier, comp, status, ready, incomplete };
  }, [f, age, isMinor]);

  const seasonHint = offensive
    ? [f.goals && `${f.goals} buts`, f.assists && `${f.assists} passes`].filter(Boolean).join(", ")
    : [f.matches && `${f.matches} matchs`, f.minutes && `${f.minutes} min`].filter(Boolean).join(", ");

  const handleGenerate = () => {
    if (!canGenerateMessage({ instagram_validated: f.instagram_validated, compliance_status: r.comp.level, incomplete: r.incomplete, is_minor: isMinor })) return;
    setMessage(generateMessage({ name: f.name, club: f.club, season_hint: seasonHint, language: f.language }));
  };

  const handleSave = () => {
    onSave?.({
      pathway: "major", name: f.name, is_minor: isMinor, age: Number(f.age) || null,
      positions: f.positions, club: f.club, country: f.country, division: f.division,
      contract_end: f.contract_end || "", market_value: Number(f.market_value) || null,
      agency_status: f.agency_status, agent_name: f.agent_name, mandate_locked: !!f.mandate_locked,
      instagram: f.instagram, instagram_validated: !!f.instagram_validated, fifa_agent_validated: !!f.fifa_agent_validated,
      language: f.language, message_text: message,
      score: r.total, score_breakdown: JSON.stringify(r.breakdown), compliance_status: r.comp.level,
      status: r.status, owner: f.owner, next_action: f.next_action, next_action_date: f.next_action_date || "",
      details: JSON.stringify({ matches: f.matches, minutes: f.minutes, goals: f.goals, assists: f.assists, nb_clubs: f.nb_clubs, target_clubs: f.target_clubs, nationalite: f.nationalite, taille: f.taille, pied: f.pied }),
    });
  };

  const CompIcon = r.comp.level === "red" ? ShieldAlert : r.comp.level === "amber" ? AlertTriangle : ShieldCheck;
  const compBox = r.comp.level === "red" ? "bg-red-50 border-red-200 text-red-800" : r.comp.level === "amber" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-green-50 border-green-200 text-green-800";

  return (
    <div className="space-y-4">
      {/* Sourcing Transfermarkt */}
      <div className="flex flex-wrap gap-2">
        {TM_LINKS.map((l) => (
          <a key={l.key} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
            <ExternalLink className="w-3.5 h-3.5" /> {l.label}
          </a>
        ))}
      </div>

      {isMinor && (
        <div className="flex items-start gap-2 border rounded-lg px-3 py-2 text-xs bg-red-50 border-red-200 text-red-800">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span><b>Joueur mineur détecté.</b> Le parcours majeur n'est pas adapté : utilisez le parcours « Joueur mineur » (workflow manuel + validation obligatoire). Le contact direct est bloqué.</span>
        </div>
      )}

      {/* Identité */}
      <Section title="Identité">
        <Txt label="Nom" value={f.name} onChange={(v) => set("name", v)} ph="Nom Prénom" />
        <Num label="Âge" value={f.age} onChange={(v) => set("age", v)} ph="20" suffix="ans" />
        <Txt label="Poste(s)" value={f.positions} onChange={(v) => set("positions", v)} ph="RW, AM" />
        <Txt label="Nationalité" value={f.nationalite} onChange={(v) => set("nationalite", v)} ph="" />
        <Num label="Taille" value={f.taille} onChange={(v) => set("taille", v)} ph="182" suffix="cm" />
        <Txt label="Pied fort" value={f.pied} onChange={(v) => set("pied", v)} ph="Gauche" />
      </Section>

      {/* Club & contrat */}
      <Section title="Club & contrat">
        <Txt label="Club actuel" value={f.club} onChange={(v) => set("club", v)} ph="" />
        <Txt label="Pays" value={f.country} onChange={(v) => set("country", v)} ph="" />
        <Txt label="Division" value={f.division} onChange={(v) => set("division", v)} ph="D2" />
        <F label="Fin de contrat"><Input type="date" value={f.contract_end} onChange={(e) => set("contract_end", e.target.value)} className="h-9" /></F>
        <Num label="Valeur marchande" value={f.market_value} onChange={(v) => set("market_value", v)} ph="2" suffix="M€" />
        <Sel label="Joueur libre ?" value={f.is_free ? "1" : "0"} onChange={(v) => set("is_free", v === "1")} options={[{ v: "0", l: "Non" }, { v: "1", l: "Oui" }]} />
      </Section>

      {/* Performance */}
      <Section title={offensive ? "Performance (offensif : G+A)" : "Performance (matchs/minutes)"}>
        <Num label="Matchs" value={f.matches} onChange={(v) => set("matches", v)} ph="29" />
        <Num label="Minutes" value={f.minutes} onChange={(v) => set("minutes", v)} ph="2400" />
        <Num label="Buts" value={f.goals} onChange={(v) => set("goals", v)} ph="10" />
        <Num label="Passes déc." value={f.assists} onChange={(v) => set("assists", v)} ph="8" />
        <Sel label="Niveau joué" value={f.level_note} onChange={(v) => set("level_note", v)} options={[{ v: "0", l: "D4 / jeunes" }, { v: "1", l: "D3" }, { v: "2", l: "D2" }, { v: "3", l: "D1 ou D2 forte" }]} />
        <Sel label="Production (apprécation)" value={f.production_note} onChange={(v) => set("production_note", v)} options={[{ v: "0", l: "Faible" }, { v: "1", l: "Moyen" }, { v: "2", l: "Bon" }, { v: "3", l: "Élite pour l'âge" }]} />
      </Section>

      {/* Agence & marché */}
      <Section title="Agence & marché">
        <Sel label="Situation agence" value={f.agency_status} onChange={(v) => set("agency_status", v)} options={[{ v: "none", l: "Sans agent" }, { v: "small", l: "Petite agence" }, { v: "large", l: "Grande agence" }, { v: "unknown", l: "Incertaine" }]} />
        <Txt label="Nom agent / agence" value={f.agent_name} onChange={(v) => set("agent_name", v)} ph="" />
        <Sel label="Mandat verrouillé ?" value={f.mandate_locked ? "1" : "0"} onChange={(v) => set("mandate_locked", v === "1")} options={[{ v: "0", l: "Non / inconnu" }, { v: "1", l: "Oui (exclusif confirmé)" }]} />
        <Num label="Nb clubs cibles" value={f.nb_clubs} onChange={(v) => set("nb_clubs", v)} ph="5" />
        <div className="sm:col-span-2"><Txt label="Clubs cibles" value={f.target_clubs} onChange={(v) => set("target_clubs", v)} ph="Club A, Club B, …" /></div>
      </Section>

      {/* Contact */}
      <Section title="Contact">
        <Txt label="Instagram" value={f.instagram} onChange={(v) => set("instagram", v)} ph="@handle" />
        <Sel label="IG validé ?" value={f.instagram_validated ? "1" : "0"} onChange={(v) => set("instagram_validated", v === "1")} options={[{ v: "0", l: "Non" }, { v: "1", l: "Oui (photo/club/bio)" }]} />
        <Sel label="Validé par agent FIFA ?" value={f.fifa_agent_validated ? "1" : "0"} onChange={(v) => set("fifa_agent_validated", v === "1")} options={[{ v: "0", l: "Non" }, { v: "1", l: "Oui" }]} />
        <Sel label="Langue" value={f.language} onChange={(v) => set("language", v)} options={[{ v: "FR", l: "Français" }, { v: "EN", l: "Anglais" }]} />
      </Section>

      {/* CRM */}
      <Section title="Suivi CRM">
        <Txt label="Responsable" value={f.owner} onChange={(v) => set("owner", v)} ph="" />
        <Txt label="Prochaine action" value={f.next_action} onChange={(v) => set("next_action", v)} ph="" />
        <F label="Date de relance"><Input type="date" value={f.next_action_date} onChange={(e) => set("next_action_date", e.target.value)} className="h-9" /></F>
      </Section>

      {/* ── RÉCAP / SCORING / CONFORMITÉ ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Score recrutement</div>
          <div className="text-2xl font-bold text-slate-900">{r.total}<span className="text-base text-slate-400"> / 18</span></div>
          <div className={`text-xs font-semibold mt-1 ${r.tier.color === "green" ? "text-green-600" : r.tier.color === "blue" ? "text-blue-600" : r.tier.color === "amber" ? "text-amber-600" : "text-slate-500"}`}>{r.tier.label}</div>
          <div className="mt-2 space-y-0.5">
            {r.breakdown.map((b) => <div key={b.key} className="flex justify-between text-[11px] text-slate-500"><span>{b.label}</span><span className="font-medium text-slate-700">{b.note}/3</span></div>)}
          </div>
        </div>
        <div className={`rounded-xl border p-4 ${compBox} md:col-span-2`}>
          <div className="flex items-center gap-2 font-semibold mb-1"><CompIcon className="w-4 h-4" /> Conformité — {r.comp.level === "red" ? "rouge" : r.comp.level === "amber" ? "orange" : "vert"}</div>
          <ul className="text-xs space-y-0.5 list-disc list-inside">{r.comp.reasons.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <div className="text-[11px] mt-2 opacity-90">Contact ready : {r.ready.ok ? "✅ possible" : `🚫 ${r.ready.reason}`}</div>
        </div>
      </div>

      {/* Message */}
      <div className="rounded-xl border border-slate-200 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Message de contact ({f.language})</div>
          <div className="flex gap-2">
            <Button onClick={handleGenerate} size="sm" variant="outline" className="gap-1.5" disabled={!canGenerateMessage({ instagram_validated: f.instagram_validated, compliance_status: r.comp.level, incomplete: r.incomplete, is_minor: isMinor })}><Wand2 className="w-4 h-4" /> Générer</Button>
            <Button onClick={() => message && navigator.clipboard?.writeText(message)} size="sm" variant="outline" className="gap-1.5" disabled={!message}><Copy className="w-4 h-4" /> Copier</Button>
          </div>
        </div>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Le message se génère si la fiche est complète, l'IG validé et la conformité non rouge." />
        <p className="text-[10px] text-slate-400">Ne jamais promettre un club, un salaire ou un transfert. Mentionner un élément précis de la saison.</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !f.name} className="gap-1.5"><Save className="w-4 h-4" /> Enregistrer le dossier</Button>
      </div>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div className="rounded-xl border border-slate-200 p-3 space-y-3">
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{children}</div>
  </div>
);
