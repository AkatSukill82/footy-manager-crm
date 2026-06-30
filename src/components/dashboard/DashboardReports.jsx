import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Download, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

/**
 * Widget « Rapports / Exports » (cahier §3). Génère à la demande les exports
 * clés en CSV (joueurs, contacts) — multilingue.
 */
const RP = {
  fr: { title: "Rapports / Exports", hint: "Génère un CSV à la demande (Excel / comptable).", players: "Liste des joueurs", contacts: "Liste des contacts (clubs)", nom: "Nom", poste: "Poste", age: "Âge", club: "Club", nat: "Nationalité", valeur: "Valeur (M€)", finContrat: "Fin contrat", agent: "Agent", dispo: "Disponibilité", priorite: "Priorité", email: "Email", tel: "Téléphone", pays: "Pays" },
  en: { title: "Reports / Exports", hint: "Generates a CSV on demand (Excel / accountant).", players: "Player list", contacts: "Contacts list (clubs)", nom: "Name", poste: "Position", age: "Age", club: "Club", nat: "Nationality", valeur: "Value (€M)", finContrat: "Contract end", agent: "Agent", dispo: "Availability", priorite: "Priority", email: "Email", tel: "Phone", pays: "Country" },
  es: { title: "Informes / Exportes", hint: "Genera un CSV bajo demanda (Excel / contable).", players: "Lista de jugadores", contacts: "Lista de contactos (clubes)", nom: "Nombre", poste: "Posición", age: "Edad", club: "Club", nat: "Nacionalidad", valeur: "Valor (M€)", finContrat: "Fin contrato", agent: "Agente", dispo: "Disponibilidad", priorite: "Prioridad", email: "Email", tel: "Teléfono", pays: "País" },
};

function downloadCSV(filename, cols, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [cols.map((c) => esc(c.label)).join(";")];
  for (const r of rows) lines.push(cols.map((c) => esc(c.get(r))).join(";"));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const buildReports = (T) => [
  { id: "players", label: T.players, entity: "Player", file: "joueurs", cols: [
    { label: T.nom, get: (p) => p.nom }, { label: T.poste, get: (p) => p.poste },
    { label: T.age, get: (p) => p.age }, { label: T.club, get: (p) => p.club_actuel },
    { label: T.nat, get: (p) => p.nationalite }, { label: T.valeur, get: (p) => p.valeur_marchande },
    { label: T.finContrat, get: (p) => p.contrat_fin }, { label: T.agent, get: (p) => p.agent },
    { label: T.dispo, get: (p) => p.disponibilite }, { label: T.priorite, get: (p) => p.priorite_recrutement },
  ] },
  { id: "contacts", label: T.contacts, entity: "ClubContact", file: "contacts", cols: [
    { label: T.nom, get: (c) => c.nom }, { label: T.club, get: (c) => c.club },
    { label: T.poste, get: (c) => c.poste }, { label: T.email, get: (c) => c.email },
    { label: T.tel, get: (c) => c.telephone }, { label: T.pays, get: (c) => c.pays },
  ] },
];

export default function DashboardReports() {
  const { lang } = useLanguage();
  const T = RP[lang] || RP.fr;
  const REPORTS = buildReports(T);
  const [busy, setBusy] = useState(null);
  const run = async (r) => {
    setBusy(r.id);
    try {
      const rows = await base44.entities[r.entity].filter({});
      downloadCSV(`${r.file}_${new Date().toISOString().split("T")[0]}.csv`, r.cols, rows);
    } catch { /* ignore */ } finally { setBusy(null); }
  };
  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-50">
        <FileText className="w-4 h-4 text-indigo-500" />
        <span className="font-semibold text-slate-800 text-sm">{T.title}</span>
      </div>
      <div className="p-3 space-y-1.5">
        {REPORTS.map((r) => (
          <button key={r.id} onClick={() => run(r)} disabled={!!busy} className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">
            <span className="text-slate-700">{r.label}</span>
            {busy === r.id ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Download className="w-4 h-4 text-slate-400" />}
          </button>
        ))}
        <p className="text-[10px] text-slate-400 px-3 pt-1">{T.hint}</p>
      </div>
    </div>
  );
}
