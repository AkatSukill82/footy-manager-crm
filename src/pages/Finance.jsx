import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wallet, Plus, Loader2, ArrowDownLeft, ArrowUpRight, Scale,
  Pencil, Trash2, FileDown, FileText, Users, List, FlaskConical, CheckCircle2,
} from "lucide-react";

// ── Référentiels ──────────────────────────────────────────────────────────────

const INCOME_TYPES = [
  { v: "transfert",              label: "Transfert" },
  { v: "renouvellement_contrat", label: "Renouvellement contrat" },
  { v: "premier_contrat",        label: "Premier contrat" },
  { v: "sponsoring",             label: "Sponsoring" },
  { v: "commission_salaire",     label: "Commission sur salaire" },
  { v: "prime",                  label: "Prime" },
  { v: "autre",                  label: "Autre (revenu)" },
];
const EXPENSE_TYPES = [
  { v: "frais_scouting",  label: "Frais de scouting" },
  { v: "deplacement",     label: "Déplacement" },
  { v: "frais_juridique", label: "Frais juridiques" },
  { v: "autre_depense",   label: "Autre (dépense)" },
];
const ALL_TYPES = [...INCOME_TYPES, ...EXPENSE_TYPES];
const typeLabel = (v) => ALL_TYPES.find((t) => t.v === v)?.label || v || "—";

const DEVISE_SY = { EUR: "€", GBP: "£", USD: "$" };
const fmtMoney = (n, d = "EUR") =>
  n == null ? "—" : `${Number(n).toLocaleString("fr-FR")} ${DEVISE_SY[d] || "€"}`;
const fmtSigned = (n) => `${n >= 0 ? "+" : "−"}${Math.abs(Math.round(n)).toLocaleString("fr-FR")} €`;

const todayISO = () => new Date().toISOString().split("T")[0];
const isSortie = (c) => c.sens === "sortie";
const isReel = (c) => c.nature === "reel";
// Montant signé en € (entrée +, sortie −).
const signed = (c) => (isSortie(c) ? -1 : 1) * (Number(c.montant) || 0);

// ── Formulaire ──────────────────────────────────────────────────────────────

function EntryForm({ open, onClose, onSave, initial, players, saving }) {
  const [f, setF] = useState(() => initial || {
    sens: "entree", nature: "projection", titre: "", player_id: "", player_nom: "", club: "",
    type: "transfert", montant_operation: "", taux: "", montant: "", devise: "EUR",
    statut: "a_facturer", date_echeance: "", date_paiement: "", notes: "",
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const sortie = f.sens === "sortie";
  const typeOptions = sortie ? EXPENSE_TYPES : INCOME_TYPES;

  const autoMontant = () => {
    const op = parseFloat(f.montant_operation), tx = parseFloat(f.taux);
    if (!isNaN(op) && !isNaN(tx)) setF((s) => ({ ...s, montant: Math.round(op * 1_000_000 * tx / 100) }));
  };
  const onPlayer = (id) => {
    const p = players.find((x) => x.id === id);
    setF((s) => ({ ...s, player_id: id, player_nom: p?.nom || "", club: s.club || p?.club_actuel || "" }));
  };
  const onSens = (v) => setF((s) => ({
    ...s, sens: v,
    type: (v === "sortie" ? EXPENSE_TYPES : INCOME_TYPES).some((t) => t.v === s.type) ? s.type : (v === "sortie" ? "frais_scouting" : "transfert"),
  }));

  const submit = () => {
    if (!f.titre.trim() || f.montant === "" || f.montant == null) return;
    const clean = {
      ...f,
      montant_operation: f.montant_operation === "" ? null : Number(f.montant_operation),
      taux: f.taux === "" ? null : Number(f.taux),
      montant: Math.abs(Number(f.montant)),
    };
    Object.keys(clean).forEach((k) => { if (clean[k] === "") clean[k] = null; });
    onSave(clean);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Modifier la ligne" : "Nouvelle ligne financière"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Sens + Nature */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Sens *</Label>
              <Select value={f.sens} onValueChange={onSens}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entree">Entrée (gain / commission)</SelectItem>
                  <SelectItem value="sortie">Sortie (dépense)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Nature *</Label>
              <Select value={f.nature} onValueChange={set("nature")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="projection">Projection (estimé)</SelectItem>
                  <SelectItem value="reel">Réel (réalisé)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Libellé *</Label>
            <Input value={f.titre} onChange={set("titre")} placeholder={sortie ? "Ex: Déplacement scouting Lisbonne" : "Ex: Commission transfert J. Doe → OL"} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Joueur</Label>
              <Select value={f.player_id || ""} onValueChange={onPlayer}>
                <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  {players.map((p) => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Catégorie</Label>
              <Select value={f.type} onValueChange={set("type")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Club</Label>
            <Input value={f.club} onChange={set("club")} placeholder="Club concerné" />
          </div>

          {!sortie && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Opération (M€)</Label>
                <Input type="number" value={f.montant_operation} onChange={set("montant_operation")} onBlur={autoMontant} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs">Taux (%)</Label>
                <Input type="number" value={f.taux} onChange={set("taux")} onBlur={autoMontant} placeholder="0" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{sortie ? "Montant dépensé (€) *" : "Commission (€) *"}</Label>
              <Input type="number" value={f.montant} onChange={set("montant")} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Devise</Label>
              <Select value={f.devise} onValueChange={set("devise")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR €</SelectItem>
                  <SelectItem value="GBP">GBP £</SelectItem>
                  <SelectItem value="USD">USD $</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isReel(f) ? "Date (réalisé)" : "Échéance prévue"}</Label>
              <Input type="date" value={(isReel(f) ? f.date_paiement : f.date_echeance) || ""} onChange={set(isReel(f) ? "date_paiement" : "date_echeance")} />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input value={f.notes || ""} onChange={set("notes")} placeholder="—" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} disabled={saving || !f.titre.trim() || f.montant === ""} className="bg-slate-900 hover:bg-slate-700">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {initial?.id ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── KPI ────────────────────────────────────────────────────────────────────────

function Kpi({ icon: Icon, label, value, sub, color }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-4 h-4" /></div>
          <span className="text-xs text-slate-500">{label}</span>
        </div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// ── Export CSV ───────────────────────────────────────────────────────────────

function toCSV(rows) {
  const headers = ["Date", "Sens", "Nature", "Catégorie", "Libellé", "Joueur", "Club", "Montant (€)", "Devise"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(";")];
  for (const c of rows) {
    lines.push([
      c.date_paiement || c.date_echeance || "",
      isSortie(c) ? "Sortie" : "Entrée",
      isReel(c) ? "Réel" : "Projection",
      typeLabel(c.type),
      c.titre || "",
      c.player_nom || "",
      c.club || "",
      signed(c),
      c.devise || "EUR",
    ].map(esc).join(";"));
  }
  return lines.join("\r\n");
}
function downloadCSV(filename, rows) {
  const blob = new Blob(["﻿" + toCSV(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// Export PDF (impression) — rapport comptable / joueur (obligation FIFA).
function exportPDF(title, rows, sub = "") {
  const esc = (s) => String(s ?? "").replace(/</g, "&lt;");
  let entrees = 0, sorties = 0;
  const body = rows.map((c) => {
    const m = Number(c.montant) || 0;
    if (isSortie(c)) sorties += m; else entrees += m;
    return `<tr><td>${c.date_paiement || c.date_echeance || ""}</td><td>${isSortie(c) ? "Sortie" : "Entrée"}</td>`
      + `<td>${isReel(c) ? "Réel" : "Projection"}</td><td>${esc(typeLabel(c.type))}</td>`
      + `<td class="l">${esc(c.titre)}${c.player_nom ? `<br><span class="m">${esc(c.player_nom)}</span>` : ""}</td>`
      + `<td class="r ${isSortie(c) ? "red" : "grn"}">${isSortie(c) ? "−" : "+"}${m.toLocaleString("fr-FR")} €</td></tr>`;
  }).join("");
  const solde = entrees - sorties;
  const fmt = (n) => `${Math.round(n).toLocaleString("fr-FR")} €`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
   <style>body{font-family:Arial,sans-serif;padding:32px;color:#1e293b}h1{font-size:20px;margin:0}
   .sub{color:#64748b;font-size:12px;margin:4px 0 16px}table{border-collapse:collapse;width:100%;font-size:12px}
   th,td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left}th{background:#0f172a;color:#fff}
   td.r,th.r{text-align:right}.grn{color:#15803d}.red{color:#dc2626}.m{color:#94a3b8;font-size:10px}
   tfoot td{font-weight:bold;background:#f8fafc}.foot{margin-top:24px;font-size:10px;color:#94a3b8}</style></head><body>
   <h1>${esc(title)}</h1><div class="sub">${esc(sub)}${sub ? " · " : ""}Généré le ${new Date().toLocaleDateString("fr-FR")}</div>
   <table><thead><tr><th>Date</th><th>Sens</th><th>Nature</th><th>Catégorie</th><th>Libellé</th><th class="r">Montant</th></tr></thead>
   <tbody>${body}</tbody><tfoot>
     <tr><td colspan="5">Total entrées (gains)</td><td class="r grn">${fmt(entrees)}</td></tr>
     <tr><td colspan="5">Total sorties (dépenses)</td><td class="r red">${fmt(sorties)}</td></tr>
     <tr><td colspan="5">Solde net</td><td class="r ${solde >= 0 ? "grn" : "red"}">${solde >= 0 ? "+" : "−"}${fmt(Math.abs(solde))}</td></tr>
   </tfoot></table>
   <p class="foot">Football Data Management — document financier. « Projection » = estimé/prévu, « Réel » = réalisé. À usage interne / comptable.</p>
   <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html); w.document.close();
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState("global");        // global | players
  const [fNature, setFNature] = useState("tous");     // tous | projection | reel
  const [fSens, setFSens] = useState("tous");         // tous | entree | sortie
  const [mutError, setMutError] = useState(null);
  const onErr = (e) => setMutError(e?.message || "Opération impossible.");

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me(), staleTime: Infinity });
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["commissions", user?.id],
    queryFn: () => base44.entities.Commission.filter({}, "-created_date"),
    enabled: !!user?.id,
  });
  const { data: players = [] } = useQuery({
    queryKey: ["players", user?.id],
    queryFn: () => base44.entities.Player.filter({}, "-created_date"),
    enabled: !!user?.id, staleTime: Infinity,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["commissions"] });
  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Commission.create({ ...data, organization_id: user?.organization_id ?? null }),
    onSuccess: () => { invalidate(); setShowForm(false); setEditing(null); }, onError: onErr,
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Commission.update(id, data),
    onSuccess: () => { invalidate(); setShowForm(false); setEditing(null); }, onError: onErr,
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Commission.delete(id), onSuccess: invalidate, onError: onErr,
  });
  // Bascule projection → réel (le gain/la dépense a réellement eu lieu).
  const markReel = (c) =>
    updateMut.mutate({ id: c.id, data: { nature: "reel", date_paiement: c.date_paiement || todayISO() } });

  const saving = createMut.isPending || updateMut.isPending;

  // ── Filtres ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => entries.filter((c) =>
    (fNature === "tous" || c.nature === fNature) &&
    (fSens === "tous" || (c.sens || "entree") === fSens)
  ), [entries, fNature, fSens]);

  // ── KPIs (rentabilité) ───────────────────────────────────────────────────
  const kpi = useMemo(() => {
    let entRe = 0, sorRe = 0, entAll = 0, sorAll = 0;
    for (const c of entries) {
      const m = Number(c.montant) || 0;
      if (isSortie(c)) { sorAll += m; if (isReel(c)) sorRe += m; }
      else { entAll += m; if (isReel(c)) entRe += m; }
    }
    return { entRe, sorRe, soldeReel: entRe - sorRe, soldeProj: entAll - sorAll, entAll, sorAll };
  }, [entries]);

  // ── Agrégat par joueur ───────────────────────────────────────────────────
  const perPlayer = useMemo(() => {
    const map = {};
    for (const c of filtered) {
      const key = c.player_id || `__${c.player_nom || "Sans joueur"}`;
      const name = c.player_nom || "Sans joueur";
      const row = map[key] || (map[key] = { key, name, entree: 0, sortie: 0, n: 0 });
      if (isSortie(c)) row.sortie += Number(c.montant) || 0;
      else row.entree += Number(c.montant) || 0;
      row.n++;
    }
    return Object.values(map)
      .map((r) => ({ ...r, solde: r.entree - r.sortie }))
      .sort((a, b) => a.solde - b.solde); // les moins rentables en premier
  }, [filtered]);

  const sub = `${fSens === "tous" ? "Entrées + sorties" : fSens === "sortie" ? "Sorties" : "Entrées"} · ${fNature === "tous" ? "Réel + projection" : fNature === "reel" ? "Réel" : "Projection"}`;
  const exportAll = () => downloadCSV(`finance_${todayISO()}.csv`, filtered);
  const exportAllPDF = () => exportPDF("Finance — toutes transactions", filtered, sub);
  const playerRows = (row) => entries.filter((c) => (c.player_id || `__${c.player_nom || "Sans joueur"}`) === row.key);
  const exportPlayer = (row) => downloadCSV(`finance_${(row.name || "joueur").replace(/\s+/g, "_")}.csv`, playerRows(row));
  const exportPlayerPDF = (row) => exportPDF(`Finance — ${row.name}`, playerRows(row), "Détail par joueur");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        {mutError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <span className="flex-1">{mutError}</span>
            <button onClick={() => setMutError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-7 h-7 text-green-600" /> Finance — entrées & sorties
            </h1>
            <p className="text-xs text-slate-500 mt-1">Commissions, dépenses et rentabilité, par opération ou par joueur. Projection vs réel.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportAll} disabled={!filtered.length}><FileDown className="w-4 h-4 mr-2" /> CSV</Button>
            <Button variant="outline" onClick={exportAllPDF} disabled={!filtered.length}><FileText className="w-4 h-4 mr-2" /> PDF</Button>
            <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" /> Nouvelle ligne
            </Button>
          </div>
        </div>

        {/* KPIs rentabilité */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi icon={ArrowDownLeft} label="Entrées (réel)" value={fmtMoney(kpi.entRe)} color="bg-green-100 text-green-700" />
          <Kpi icon={ArrowUpRight} label="Sorties (réel)" value={fmtMoney(kpi.sorRe)} color="bg-red-100 text-red-700" />
          <Kpi icon={Scale} label="Solde réel (rentabilité)" value={fmtSigned(kpi.soldeReel)} sub="gains − dépenses réalisés" color={kpi.soldeReel >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} />
          <Kpi icon={FlaskConical} label="Solde projeté" value={fmtSigned(kpi.soldeProj)} sub="réel + projections" color="bg-indigo-100 text-indigo-700" />
        </div>

        {/* Barre d'outils : vue + filtres */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex gap-1">
            <button onClick={() => setView("global")} className={`text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 ${view === "global" ? "bg-slate-900 text-white" : "text-slate-500"}`}><List className="w-3.5 h-3.5" /> Global</button>
            <button onClick={() => setView("players")} className={`text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 ${view === "players" ? "bg-slate-900 text-white" : "text-slate-500"}`}><Users className="w-3.5 h-3.5" /> Par joueur</button>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {[["tous", "Tout"], ["reel", "Réel"], ["projection", "Projection"]].map(([k, l]) => (
              <button key={k} onClick={() => setFNature(k)} className={`text-xs px-3 py-1.5 rounded-full font-medium ${fNature === k ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500"}`}>{l}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {[["tous", "Tous"], ["entree", "Entrées"], ["sortie", "Sorties"]].map(([k, l]) => (
              <button key={k} onClick={() => setFSens(k)} className={`text-xs px-3 py-1.5 rounded-full font-medium ${fSens === k ? "bg-slate-700 text-white" : "bg-white border border-slate-200 text-slate-500"}`}>{l}</button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-green-500 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-slate-400">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            {entries.length === 0 ? "Aucune ligne. Ajoutez une entrée/sortie ou envoyez une commission depuis le simulateur." : "Aucune ligne dans ce filtre."}
          </CardContent></Card>
        ) : view === "players" ? (
          /* ── Vue par joueur (rentabilité) ── */
          <Card><CardContent className="p-0"><div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr className="text-xs text-slate-500">
                <th className="text-left px-4 py-2.5 font-medium">Joueur</th>
                <th className="text-right px-3 py-2.5 font-medium">Entrées</th>
                <th className="text-right px-3 py-2.5 font-medium">Sorties</th>
                <th className="text-right px-3 py-2.5 font-medium">Solde</th>
                <th className="px-3 py-2.5"></th>
              </tr></thead>
              <tbody>
                {perPlayer.map((r) => (
                  <tr key={r.key} className="border-t border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{r.name}<span className="text-[11px] text-slate-400 font-normal"> · {r.n} ligne{r.n > 1 ? "s" : ""}</span></td>
                    <td className="px-3 py-2.5 text-right text-green-700">{fmtMoney(r.entree)}</td>
                    <td className="px-3 py-2.5 text-right text-red-600">{fmtMoney(r.sortie)}</td>
                    <td className={`px-3 py-2.5 text-right font-bold ${r.solde >= 0 ? "text-green-700" : "text-red-600"}`}>{fmtSigned(r.solde)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => exportPlayer(r)} title="Export joueur (CSV)" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><FileDown className="w-4 h-4" /></button>
                        <button onClick={() => exportPlayerPDF(r)} title="Export joueur (PDF — FIFA)" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><FileText className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></CardContent></Card>
        ) : (
          /* ── Vue globale (lignes) ── */
          <Card><CardContent className="p-0"><div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr className="text-xs text-slate-500">
                <th className="text-left px-4 py-2.5 font-medium">Libellé</th>
                <th className="text-left px-3 py-2.5 font-medium">Catégorie</th>
                <th className="text-left px-3 py-2.5 font-medium">Nature</th>
                <th className="text-right px-3 py-2.5 font-medium">Montant</th>
                <th className="px-3 py-2.5"></th>
              </tr></thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        {isSortie(c) ? <ArrowUpRight className="w-3.5 h-3.5 text-red-500" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-green-600" />}
                        {c.titre}
                      </div>
                      <div className="text-[11px] text-slate-400">{[c.player_nom, c.club].filter(Boolean).join(" · ") || "—"}</div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 text-xs">{typeLabel(c.type)}</td>
                    <td className="px-3 py-2.5">
                      <Badge className={`border-0 text-[11px] ${isReel(c) ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"}`}>
                        {isReel(c) ? "Réel" : "Projection"}
                      </Badge>
                    </td>
                    <td className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${isSortie(c) ? "text-red-600" : "text-green-700"}`}>
                      {isSortie(c) ? "−" : "+"}{fmtMoney(c.montant, c.devise)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {!isReel(c) && (
                          <button onClick={() => markReel(c)} title="Marquer réalisé (réel)" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"><CheckCircle2 className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => { setEditing(c); setShowForm(true); }} title="Modifier" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm(`Supprimer "${c.titre}" ?`)) deleteMut.mutate(c.id); }} title="Supprimer" className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></CardContent></Card>
        )}
      </div>

      {showForm && (
        <EntryForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={(data) => editing?.id ? updateMut.mutate({ id: editing.id, data }) : createMut.mutate(data)}
          initial={editing}
          players={players}
          saving={saving}
        />
      )}
    </div>
  );
}
