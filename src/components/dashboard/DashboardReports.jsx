import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Download, Loader2 } from "lucide-react";

/**
 * Widget « Rapports / Exports » (cahier §3). Génère à la demande les exports
 * clés en CSV (joueurs, contacts) — utilisable par le comptable/partenaire.
 */
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

const REPORTS = [
  {
    id: "players", label: "Liste des joueurs", entity: "Player", file: "joueurs",
    cols: [
      { label: "Nom", get: (p) => p.nom }, { label: "Poste", get: (p) => p.poste },
      { label: "Âge", get: (p) => p.age }, { label: "Club", get: (p) => p.club_actuel },
      { label: "Nationalité", get: (p) => p.nationalite }, { label: "Valeur (M€)", get: (p) => p.valeur_marchande },
      { label: "Fin contrat", get: (p) => p.contrat_fin }, { label: "Agent", get: (p) => p.agent },
      { label: "Disponibilité", get: (p) => p.disponibilite }, { label: "Priorité", get: (p) => p.priorite_recrutement },
    ],
  },
  {
    id: "contacts", label: "Liste des contacts (clubs)", entity: "ClubContact", file: "contacts",
    cols: [
      { label: "Nom", get: (c) => c.nom }, { label: "Club", get: (c) => c.club },
      { label: "Poste", get: (c) => c.poste }, { label: "Email", get: (c) => c.email },
      { label: "Téléphone", get: (c) => c.telephone }, { label: "Pays", get: (c) => c.pays },
    ],
  },
];

export default function DashboardReports() {
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
        <span className="font-semibold text-slate-800 text-sm">Rapports / Exports</span>
      </div>
      <div className="p-3 space-y-1.5">
        {REPORTS.map((r) => (
          <button key={r.id} onClick={() => run(r)} disabled={!!busy} className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">
            <span className="text-slate-700">{r.label}</span>
            {busy === r.id ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Download className="w-4 h-4 text-slate-400" />}
          </button>
        ))}
        <p className="text-[10px] text-slate-400 px-3 pt-1">Génère un CSV à la demande (Excel / comptable).</p>
      </div>
    </div>
  );
}
