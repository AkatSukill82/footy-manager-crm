import React, { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet } from "lucide-react";

/**
 * Import manuel depuis une recherche Transfermarkt (cahier §21 P1).
 * On colle le tableau (copier-coller depuis Transfermarkt/Excel = TSV, ou CSV).
 * 1re ligne = en-têtes. Chaque joueur devient un dossier "long list" à qualifier.
 */
const COLS = [
  { key: "name",        match: ["player", "joueur", "nom", "name"] },
  { key: "age",         match: ["age", "âge"] },
  { key: "club",        match: ["club"] },
  { key: "division",    match: ["division", "league", "ligue", "niveau"] },
  { key: "positions",   match: ["pos", "poste", "position"] },
  { key: "goals",       match: ["goal", "but"] },
  { key: "assists",     match: ["assist", "passe"] },
  { key: "contract",    match: ["contract", "contrat", "vertrag"] },
];

function parse(text) {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const delim = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delim).map((h) => h.trim().toLowerCase());
  const idx = {};
  COLS.forEach((c) => {
    const i = headers.findIndex((h) => c.match.some((m) => h.includes(m)));
    if (i >= 0) idx[c.key] = i;
  });
  return lines.slice(1).map((line) => {
    const cells = line.split(delim).map((c) => c.trim());
    const row = {};
    COLS.forEach((c) => { row[c.key] = idx[c.key] != null ? (cells[idx[c.key]] || "") : ""; });
    return row;
  }).filter((r) => r.name);
}

const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; };

function toPayload(row) {
  const age = num(row.age);
  return {
    pathway: "major", name: row.name, is_minor: age > 0 && age < 18, age: age || null,
    positions: row.positions || "", club: row.club || "", division: row.division || "",
    status: "long_list", score: 0, next_action: "Qualifier le profil",
    details: JSON.stringify({
      name: row.name, age: age ? String(age) : "", positions: row.positions || "", club: row.club || "",
      division: row.division || "", goals: row.goals || "", assists: row.assists || "", contract_end: "",
    }),
  };
}

export default function ImportTransfermarkt({ onImport }) {
  const [text, setText] = useState("");
  const rows = useMemo(() => parse(text), [text]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-3">
      <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
        <FileSpreadsheet className="w-4 h-4 text-slate-400" /> Import depuis Transfermarkt (copier-coller)
      </div>
      <p className="text-xs text-slate-500">Copiez le tableau depuis Transfermarkt (ou Excel) et collez-le ici. 1re ligne = en-têtes (Player, Age, Club, League, Pos, Goals, Assists…). Chaque ligne crée un dossier « long list » à qualifier.</p>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder={"Player\tAge\tClub\tLeague\tPos\tGoals\tAssists\nExample A\t21\tBelgium D2\tD2\tRW\t12\t9"} className="font-mono text-xs" />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{rows.length} joueur(s) détecté(s)</span>
        <Button size="sm" disabled={!rows.length} onClick={() => { onImport?.(rows.map(toPayload)); setText(""); }} className="gap-1.5">
          <Upload className="w-4 h-4" /> Importer {rows.length || ""} joueur(s)
        </Button>
      </div>
    </div>
  );
}
