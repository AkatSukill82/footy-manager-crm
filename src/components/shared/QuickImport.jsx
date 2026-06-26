import React, { useState } from "react";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";
import { base44 } from "@/api/base44Client";
import { withOrg } from "@/lib/org";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";

/**
 * Composant d'import RÉUTILISABLE (cahier §15) : Excel/CSV → n'importe quelle
 * entité Base44, avec auto-mapping des colonnes (par libellé/clé/alias).
 *   <QuickImport entity="Player" fields={[{key,label,aliases,num}]} />
 * Les données importées sont partagées au groupe (withOrg).
 */
const norm = (s) => String(s ?? "").toLowerCase().trim().replace(/[\s\-/]+/g, "_").replace(/[^a-z0-9_]/g, "");

export default function QuickImport({ entity, fields = [], label = "Importer (Excel/CSV)", onDone }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const aliasMap = {};
  const numKeys = new Set();
  for (const f of fields) {
    aliasMap[norm(f.key)] = f.key;
    aliasMap[norm(f.label)] = f.key;
    (f.aliases || []).forEach((a) => { aliasMap[norm(a)] = f.key; });
    if (f.num) numKeys.add(f.key);
  }

  const reset = () => { setRows([]); setResult(null); setError(null); };

  const onFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    reset();
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const mapped = json.map((r) => {
        const out = {};
        for (const [h, v] of Object.entries(r)) {
          const key = aliasMap[norm(h)];
          if (!key || v === "" || v == null) continue;
          out[key] = numKeys.has(key) ? (Number(String(v).replace(",", ".")) || null) : String(v).trim();
        }
        return out;
      }).filter((o) => Object.keys(o).length > 0);
      setRows(mapped);
    } catch { setError("Fichier illisible. Utilise un .xlsx ou .csv."); }
  };

  const doImport = async () => {
    setBusy(true); setError(null);
    let ok = 0, fail = 0;
    for (const r of rows) {
      try { await base44.entities[entity].create(withOrg(r)); ok++; } catch { fail++; }
    }
    setBusy(false); setResult({ ok, fail });
    onDone?.();
  };

  return (
    <>
      <Button variant="outline" onClick={() => { setOpen(true); reset(); }} className="gap-2">
        <Upload className="w-4 h-4" /> {label}
      </Button>
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Importer — {entity}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-6 cursor-pointer hover:border-green-400">
              <FileSpreadsheet className="w-6 h-6 text-slate-400" />
              <span className="text-slate-500">Choisir un fichier .xlsx ou .csv</span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="hidden" />
            </label>
            <p className="text-[11px] text-slate-400">Colonnes reconnues : {fields.map((f) => f.label).join(", ")}.</p>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            {rows.length > 0 && !result && <p className="text-slate-600"><b>{rows.length}</b> ligne(s) prête(s) à importer.</p>}
            {result && <p className="text-green-700 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {result.ok} importé(s){result.fail ? ` · ${result.fail} échec(s)` : ""}.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
            <Button onClick={doImport} disabled={busy || rows.length === 0 || !!result} className="bg-green-600 hover:bg-green-700">
              {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Importer{rows.length ? ` ${rows.length}` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
