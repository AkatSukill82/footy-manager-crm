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
  Pencil, Trash2, FileDown, FileText, Users, List, FlaskConical, CheckCircle2, Briefcase,
} from "lucide-react";
import QuickImport from "../components/shared/QuickImport";
import { useLanguage } from "../lib/LanguageContext";

// ── Référentiels ──────────────────────────────────────────────────────────────

const INCOME_KEYS = ["transfert", "renouvellement_contrat", "premier_contrat", "sponsoring", "commission_salaire", "prime", "autre"];
const EXPENSE_KEYS = ["frais_scouting", "deplacement", "frais_juridique", "autre_depense"];
// Libellé de catégorie traduit (FIN_L défini plus bas, lu au runtime).
const typeLabel = (v, lang = "fr") => (FIN_L[lang] || FIN_L.fr).cats[v] || v || "—";

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

function EntryForm({ open, onClose, onSave, initial, players, saving, lang = "fr" }) {
  const D = FIN_L[lang] || FIN_L.fr; const U = D.ui;
  const [f, setF] = useState(() => initial || {
    sens: "entree", nature: "projection", titre: "", player_id: "", player_nom: "", club: "",
    type: "transfert", montant_operation: "", taux: "", montant: "", devise: "EUR",
    statut: "a_facturer", date_echeance: "", date_paiement: "", notes: "", agent_beneficiaire: "",
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const sortie = f.sens === "sortie";
  const typeOptions = sortie ? EXPENSE_KEYS : INCOME_KEYS;

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
    type: (v === "sortie" ? EXPENSE_KEYS : INCOME_KEYS).includes(s.type) ? s.type : (v === "sortie" ? "frais_scouting" : "transfert"),
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
          <DialogTitle>{initial?.id ? U.formEdit : U.formNew}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Sens + Nature */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{U.sensReq}</Label>
              <Select value={f.sens} onValueChange={onSens}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entree">{U.sensInLong}</SelectItem>
                  <SelectItem value="sortie">{U.sensOutLong}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{U.natReq}</Label>
              <Select value={f.nature} onValueChange={set("nature")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="projection">{U.natProjLong}</SelectItem>
                  <SelectItem value="reel">{U.natReelLong}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">{U.libReq}</Label>
            <Input value={f.titre} onChange={set("titre")} placeholder={sortie ? U.titrePhOut : U.titrePhIn} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{D.joueur}</Label>
              <Select value={f.player_id || ""} onValueChange={onPlayer}>
                <SelectTrigger><SelectValue placeholder={U.none} /></SelectTrigger>
                <SelectContent>
                  {players.map((p) => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{D.cat}</Label>
              <Select value={f.type} onValueChange={set("type")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {typeOptions.map((v) => <SelectItem key={v} value={v}>{D.cats[v]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{D.club}</Label>
              <Input value={f.club} onChange={set("club")} placeholder={U.clubPh} />
            </div>
            <div>
              <Label className="text-xs">{U.agentPart}</Label>
              <Input value={f.agent_beneficiaire || ""} onChange={set("agent_beneficiaire")} placeholder={U.agentPh} />
            </div>
          </div>

          {!sortie && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{U.op}</Label>
                <Input type="number" value={f.montant_operation} onChange={set("montant_operation")} onBlur={autoMontant} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs">{U.taux}</Label>
                <Input type="number" value={f.taux} onChange={set("taux")} onBlur={autoMontant} placeholder="0" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{sortie ? U.montantOut : U.montantIn}</Label>
              <Input type="number" value={f.montant} onChange={set("montant")} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">{D.devise}</Label>
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
              <Label className="text-xs">{isReel(f) ? U.dateReel : U.dateEch}</Label>
              <Input type="date" value={(isReel(f) ? f.date_paiement : f.date_echeance) || ""} onChange={set(isReel(f) ? "date_paiement" : "date_echeance")} />
            </div>
            <div>
              <Label className="text-xs">{U.notes}</Label>
              <Input value={f.notes || ""} onChange={set("notes")} placeholder="—" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{U.cancel}</Button>
          <Button onClick={submit} disabled={saving || !f.titre.trim() || f.montant === ""} className="bg-slate-900 hover:bg-slate-700">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {initial?.id ? U.save : U.add}
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

const FIN_LOC = { fr: "fr-FR", en: "en-GB", es: "es-ES" };
const FIN_L = {
  fr: { date: "Date", sens: "Sens", nature: "Nature", cat: "Catégorie", lib: "Libellé", joueur: "Joueur", club: "Club", montant: "Montant", devise: "Devise", sortie: "Sortie", entree: "Entrée", reel: "Réel", projection: "Projection", generatedOn: "Généré le", totalIn: "Total entrées (gains)", totalOut: "Total sorties (dépenses)", solde: "Solde net", footer: "Football Data Management — document financier. « Projection » = estimé/prévu, « Réel » = réalisé. À usage interne / comptable.", allTitle: "Finance — toutes transactions", perPlayer: "Détail par joueur", subIn: "Entrées", subOut: "Sorties", subBoth: "Entrées + sorties", subReelN: "Réel", subProjN: "Projection", subBothN: "Réel + projection",
    cats: { transfert: "Transfert", renouvellement_contrat: "Renouvellement contrat", premier_contrat: "Premier contrat", sponsoring: "Sponsoring", commission_salaire: "Commission sur salaire", prime: "Prime", autre: "Autre (revenu)", frais_scouting: "Frais de scouting", deplacement: "Déplacement", frais_juridique: "Frais juridiques", autre_depense: "Autre (dépense)" },
    ui: { formEdit: "Modifier la ligne", formNew: "Nouvelle ligne financière", sensReq: "Sens *", sensInLong: "Entrée (gain / commission)", sensOutLong: "Sortie (dépense)", natReq: "Nature *", natProjLong: "Projection (estimé)", natReelLong: "Réel (réalisé)", libReq: "Libellé *", titrePhOut: "Ex: Déplacement scouting Lisbonne", titrePhIn: "Ex: Commission transfert J. Doe → OL", none: "Aucun", agentPart: "Agent / partenaire", agentPh: "Bénéficiaire / split", clubPh: "Club concerné", op: "Opération (M€)", taux: "Taux (%)", montantOut: "Montant dépensé (€) *", montantIn: "Commission (€) *", dateReel: "Date (réalisé)", dateEch: "Échéance prévue", notes: "Notes", cancel: "Annuler", save: "Enregistrer", add: "Ajouter", title: "Finance — entrées & sorties", subtitle: "Commissions, dépenses et rentabilité, par opération ou par joueur. Projection vs réel.", import: "Importer", newLine: "Nouvelle ligne", kpiIn: "Entrées (réel)", kpiOut: "Sorties (réel)", kpiReal: "Solde réel (rentabilité)", kpiRealSub: "gains − dépenses réalisés", kpiProj: "Solde projeté", kpiProjSub: "réel + projections", viewGlobal: "Global", viewPlayers: "Par joueur", viewAgents: "Par agent", fAll: "Tout", fAllM: "Tous", lignes: "ligne", lignesP: "lignes", emptyAll: "Aucune ligne. Ajoutez une entrée/sortie ou envoyez une commission depuis le simulateur.", emptyFilter: "Aucune ligne dans ce filtre.", thComm: "Commissions (entrées)", thSplits: "Sorties / splits", expCSV: "Export joueur (CSV)", expPDF: "Export joueur (PDF — FIFA)", markReel: "Marquer réalisé (réel)", edit: "Modifier", del: "Supprimer", confirmDel: "Supprimer" } },
  en: { date: "Date", sens: "Type", nature: "Status", cat: "Category", lib: "Label", joueur: "Player", club: "Club", montant: "Amount", devise: "Currency", sortie: "Expense", entree: "Income", reel: "Actual", projection: "Projection", generatedOn: "Generated on", totalIn: "Total income (gains)", totalOut: "Total expenses", solde: "Net balance", footer: "Football Data Management — financial document. \"Projection\" = estimated, \"Actual\" = realized. Internal / accounting use.", allTitle: "Finance — all transactions", perPlayer: "Per-player detail", subIn: "Income", subOut: "Expenses", subBoth: "Income + expenses", subReelN: "Actual", subProjN: "Projection", subBothN: "Actual + projection",
    cats: { transfert: "Transfer", renouvellement_contrat: "Contract renewal", premier_contrat: "First contract", sponsoring: "Sponsorship", commission_salaire: "Salary commission", prime: "Bonus", autre: "Other (income)", frais_scouting: "Scouting costs", deplacement: "Travel", frais_juridique: "Legal fees", autre_depense: "Other (expense)" },
    ui: { formEdit: "Edit entry", formNew: "New financial entry", sensReq: "Type *", sensInLong: "Income (gain / commission)", sensOutLong: "Expense (cost)", natReq: "Status *", natProjLong: "Projection (estimated)", natReelLong: "Actual (realized)", libReq: "Label *", titrePhOut: "e.g. Scouting trip Lisbon", titrePhIn: "e.g. Transfer commission J. Doe → OL", none: "None", agentPart: "Agent / partner", agentPh: "Beneficiary / split", clubPh: "Club involved", op: "Operation (€M)", taux: "Rate (%)", montantOut: "Amount spent (€) *", montantIn: "Commission (€) *", dateReel: "Date (realized)", dateEch: "Expected due date", notes: "Notes", cancel: "Cancel", save: "Save", add: "Add", title: "Finance — income & expenses", subtitle: "Commissions, expenses and profitability, per operation or per player. Projection vs actual.", import: "Import", newLine: "New entry", kpiIn: "Income (actual)", kpiOut: "Expenses (actual)", kpiReal: "Actual balance (profitability)", kpiRealSub: "realized gains − expenses", kpiProj: "Projected balance", kpiProjSub: "actual + projections", viewGlobal: "Global", viewPlayers: "Per player", viewAgents: "Per agent", fAll: "All", fAllM: "All", lignes: "entry", lignesP: "entries", emptyAll: "No entries. Add an income/expense or send a commission from the simulator.", emptyFilter: "No entries in this filter.", thComm: "Commissions (income)", thSplits: "Expenses / splits", expCSV: "Player export (CSV)", expPDF: "Player export (PDF — FIFA)", markReel: "Mark as realized (actual)", edit: "Edit", del: "Delete", confirmDel: "Delete" } },
  es: { date: "Fecha", sens: "Tipo", nature: "Estado", cat: "Categoría", lib: "Concepto", joueur: "Jugador", club: "Club", montant: "Importe", devise: "Moneda", sortie: "Salida", entree: "Entrada", reel: "Real", projection: "Proyección", generatedOn: "Generado el", totalIn: "Total entradas (ganancias)", totalOut: "Total salidas (gastos)", solde: "Saldo neto", footer: "Football Data Management — documento financiero. «Proyección» = estimado, «Real» = realizado. Uso interno / contable.", allTitle: "Finanzas — todas las transacciones", perPlayer: "Detalle por jugador", subIn: "Entradas", subOut: "Salidas", subBoth: "Entradas + salidas", subReelN: "Real", subProjN: "Proyección", subBothN: "Real + proyección",
    cats: { transfert: "Traspaso", renouvellement_contrat: "Renovación de contrato", premier_contrat: "Primer contrato", sponsoring: "Patrocinio", commission_salaire: "Comisión sobre salario", prime: "Prima", autre: "Otro (ingreso)", frais_scouting: "Gastos de scouting", deplacement: "Desplazamiento", frais_juridique: "Gastos jurídicos", autre_depense: "Otro (gasto)" },
    ui: { formEdit: "Editar línea", formNew: "Nueva línea financiera", sensReq: "Tipo *", sensInLong: "Entrada (ganancia / comisión)", sensOutLong: "Salida (gasto)", natReq: "Estado *", natProjLong: "Proyección (estimado)", natReelLong: "Real (realizado)", libReq: "Concepto *", titrePhOut: "Ej: Viaje de scouting Lisboa", titrePhIn: "Ej: Comisión traspaso J. Doe → OL", none: "Ninguno", agentPart: "Agente / socio", agentPh: "Beneficiario / reparto", clubPh: "Club implicado", op: "Operación (M€)", taux: "Tasa (%)", montantOut: "Importe gastado (€) *", montantIn: "Comisión (€) *", dateReel: "Fecha (realizado)", dateEch: "Vencimiento previsto", notes: "Notas", cancel: "Cancelar", save: "Guardar", add: "Añadir", title: "Finanzas — entradas y salidas", subtitle: "Comisiones, gastos y rentabilidad, por operación o por jugador. Proyección vs real.", import: "Importar", newLine: "Nueva línea", kpiIn: "Entradas (real)", kpiOut: "Salidas (real)", kpiReal: "Saldo real (rentabilidad)", kpiRealSub: "ganancias − gastos realizados", kpiProj: "Saldo proyectado", kpiProjSub: "real + proyecciones", viewGlobal: "Global", viewPlayers: "Por jugador", viewAgents: "Por agente", fAll: "Todo", fAllM: "Todos", lignes: "línea", lignesP: "líneas", emptyAll: "Sin líneas. Añade una entrada/salida o envía una comisión desde el simulador.", emptyFilter: "Sin líneas en este filtro.", thComm: "Comisiones (entradas)", thSplits: "Salidas / repartos", expCSV: "Exportar jugador (CSV)", expPDF: "Exportar jugador (PDF — FIFA)", markReel: "Marcar como realizado (real)", edit: "Editar", del: "Eliminar", confirmDel: "Eliminar" } },
};

function toCSV(rows, lang = "fr") {
  const D = FIN_L[lang] || FIN_L.fr;
  const headers = [D.date, D.sens, D.nature, D.cat, D.lib, D.joueur, D.club, `${D.montant} (€)`, D.devise];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(";")];
  for (const c of rows) {
    lines.push([
      c.date_paiement || c.date_echeance || "",
      isSortie(c) ? D.sortie : D.entree,
      isReel(c) ? D.reel : D.projection,
      typeLabel(c.type, lang),
      c.titre || "", c.player_nom || "", c.club || "", signed(c), c.devise || "EUR",
    ].map(esc).join(";"));
  }
  return lines.join("\r\n");
}
function downloadCSV(filename, rows, lang = "fr") {
  const blob = new Blob(["﻿" + toCSV(rows, lang)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// Export PDF (impression) — rapport comptable / joueur (obligation FIFA). Multilingue.
function exportPDF(title, rows, sub = "", lang = "fr") {
  const D = FIN_L[lang] || FIN_L.fr; const loc = FIN_LOC[lang] || FIN_LOC.fr;
  const esc = (s) => String(s ?? "").replace(/</g, "&lt;");
  let entrees = 0, sorties = 0;
  const body = rows.map((c) => {
    const m = Number(c.montant) || 0;
    if (isSortie(c)) sorties += m; else entrees += m;
    return `<tr><td>${c.date_paiement || c.date_echeance || ""}</td><td>${isSortie(c) ? D.sortie : D.entree}</td>`
      + `<td>${isReel(c) ? D.reel : D.projection}</td><td>${esc(typeLabel(c.type, lang))}</td>`
      + `<td class="l">${esc(c.titre)}${c.player_nom ? `<br><span class="m">${esc(c.player_nom)}</span>` : ""}</td>`
      + `<td class="r ${isSortie(c) ? "red" : "grn"}">${isSortie(c) ? "−" : "+"}${m.toLocaleString(loc)} €</td></tr>`;
  }).join("");
  const solde = entrees - sorties;
  const fmt = (n) => `${Math.round(n).toLocaleString(loc)} €`;
  const html = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(title)}</title>
   <style>body{font-family:Arial,sans-serif;padding:32px;color:#1e293b}h1{font-size:20px;margin:0}
   .sub{color:#64748b;font-size:12px;margin:4px 0 16px}table{border-collapse:collapse;width:100%;font-size:12px}
   th,td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left}th{background:#0f172a;color:#fff}
   td.r,th.r{text-align:right}.grn{color:#15803d}.red{color:#dc2626}.m{color:#94a3b8;font-size:10px}
   tfoot td{font-weight:bold;background:#f8fafc}.foot{margin-top:24px;font-size:10px;color:#94a3b8}</style></head><body>
   <h1>${esc(title)}</h1><div class="sub">${esc(sub)}${sub ? " · " : ""}${D.generatedOn} ${new Date().toLocaleDateString(loc)}</div>
   <table><thead><tr><th>${D.date}</th><th>${D.sens}</th><th>${D.nature}</th><th>${D.cat}</th><th>${D.lib}</th><th class="r">${D.montant}</th></tr></thead>
   <tbody>${body}</tbody><tfoot>
     <tr><td colspan="5">${D.totalIn}</td><td class="r grn">${fmt(entrees)}</td></tr>
     <tr><td colspan="5">${D.totalOut}</td><td class="r red">${fmt(sorties)}</td></tr>
     <tr><td colspan="5">${D.solde}</td><td class="r ${solde >= 0 ? "grn" : "red"}">${solde >= 0 ? "+" : "−"}${fmt(Math.abs(solde))}</td></tr>
   </tfoot></table>
   <p class="foot">${D.footer}</p>
   <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html); w.document.close();
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const { lang } = useLanguage();
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

  // Agrégat par agent / partenaire (splits, soldes).
  const perAgent = useMemo(() => {
    const map = {};
    for (const c of filtered) {
      const name = (c.agent_beneficiaire || "").trim() || "— Sans agent";
      const row = map[name] || (map[name] = { key: name, name, entree: 0, sortie: 0, n: 0 });
      if (isSortie(c)) row.sortie += Number(c.montant) || 0;
      else row.entree += Number(c.montant) || 0;
      row.n++;
    }
    return Object.values(map).map((r) => ({ ...r, solde: r.entree - r.sortie })).sort((a, b) => b.entree - a.entree);
  }, [filtered]);

  const FD = FIN_L[lang] || FIN_L.fr; const U = FD.ui;
  const sub = `${fSens === "tous" ? FD.subBoth : fSens === "sortie" ? FD.subOut : FD.subIn} · ${fNature === "tous" ? FD.subBothN : fNature === "reel" ? FD.subReelN : FD.subProjN}`;
  const exportAll = () => downloadCSV(`finance_${todayISO()}.csv`, filtered, lang);
  const exportAllPDF = () => exportPDF(FD.allTitle, filtered, sub, lang);
  const playerRows = (row) => entries.filter((c) => (c.player_id || `__${c.player_nom || "Sans joueur"}`) === row.key);
  const exportPlayer = (row) => downloadCSV(`finance_${(row.name || "joueur").replace(/\s+/g, "_")}.csv`, playerRows(row), lang);
  const exportPlayerPDF = (row) => exportPDF(`Finance — ${row.name}`, playerRows(row), FD.perPlayer, lang);

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
              <Wallet className="w-7 h-7 text-green-600" /> {U.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1">{U.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <QuickImport
              entity="Commission"
              label={U.import}
              onDone={invalidate}
              fields={[
                { key: "titre", label: FD.lib, aliases: ["libelle", "label", "description"] },
                { key: "montant", label: `${FD.montant} (€)`, aliases: ["amount", "montant_eur"], num: true },
                { key: "sens", label: FD.sens, aliases: ["entree_sortie"] },
                { key: "nature", label: FD.nature, aliases: ["projection_reel"] },
                { key: "type", label: FD.cat, aliases: ["categorie", "category"] },
                { key: "player_nom", label: FD.joueur, aliases: ["joueur", "player", "nom"] },
                { key: "club", label: FD.club, aliases: ["team"] },
                { key: "agent_beneficiaire", label: U.agentPart, aliases: ["agent", "partenaire"] },
                { key: "date_echeance", label: U.dateEch, aliases: ["date", "echeance", "due_date"] },
              ]}
            />
            <Button variant="outline" onClick={exportAll} disabled={!filtered.length}><FileDown className="w-4 h-4 mr-2" /> CSV</Button>
            <Button variant="outline" onClick={exportAllPDF} disabled={!filtered.length}><FileText className="w-4 h-4 mr-2" /> PDF</Button>
            <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" /> {U.newLine}
            </Button>
          </div>
        </div>

        {/* KPIs rentabilité */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi icon={ArrowDownLeft} label={U.kpiIn} value={fmtMoney(kpi.entRe)} color="bg-green-100 text-green-700" />
          <Kpi icon={ArrowUpRight} label={U.kpiOut} value={fmtMoney(kpi.sorRe)} color="bg-red-100 text-red-700" />
          <Kpi icon={Scale} label={U.kpiReal} value={fmtSigned(kpi.soldeReel)} sub={U.kpiRealSub} color={kpi.soldeReel >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} />
          <Kpi icon={FlaskConical} label={U.kpiProj} value={fmtSigned(kpi.soldeProj)} sub={U.kpiProjSub} color="bg-indigo-100 text-indigo-700" />
        </div>

        {/* Barre d'outils : vue + filtres */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex gap-1">
            <button onClick={() => setView("global")} className={`text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 ${view === "global" ? "bg-slate-900 text-white" : "text-slate-500"}`}><List className="w-3.5 h-3.5" /> {U.viewGlobal}</button>
            <button onClick={() => setView("players")} className={`text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 ${view === "players" ? "bg-slate-900 text-white" : "text-slate-500"}`}><Users className="w-3.5 h-3.5" /> {U.viewPlayers}</button>
            <button onClick={() => setView("agents")} className={`text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 ${view === "agents" ? "bg-slate-900 text-white" : "text-slate-500"}`}><Briefcase className="w-3.5 h-3.5" /> {U.viewAgents}</button>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {[["tous", U.fAll], ["reel", FD.reel], ["projection", FD.projection]].map(([k, l]) => (
              <button key={k} onClick={() => setFNature(k)} className={`text-xs px-3 py-1.5 rounded-full font-medium ${fNature === k ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500"}`}>{l}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {[["tous", U.fAllM], ["entree", FD.subIn], ["sortie", FD.subOut]].map(([k, l]) => (
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
            {entries.length === 0 ? U.emptyAll : U.emptyFilter}
          </CardContent></Card>
        ) : view === "players" ? (
          /* ── Vue par joueur (rentabilité) ── */
          <Card><CardContent className="p-0"><div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr className="text-xs text-slate-500">
                <th className="text-left px-4 py-2.5 font-medium">{FD.joueur}</th>
                <th className="text-right px-3 py-2.5 font-medium">{FD.subIn}</th>
                <th className="text-right px-3 py-2.5 font-medium">{FD.subOut}</th>
                <th className="text-right px-3 py-2.5 font-medium">{FD.solde}</th>
                <th className="px-3 py-2.5"></th>
              </tr></thead>
              <tbody>
                {perPlayer.map((r) => (
                  <tr key={r.key} className="border-t border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{r.name}<span className="text-[11px] text-slate-400 font-normal"> · {r.n} {r.n > 1 ? U.lignesP : U.lignes}</span></td>
                    <td className="px-3 py-2.5 text-right text-green-700">{fmtMoney(r.entree)}</td>
                    <td className="px-3 py-2.5 text-right text-red-600">{fmtMoney(r.sortie)}</td>
                    <td className={`px-3 py-2.5 text-right font-bold ${r.solde >= 0 ? "text-green-700" : "text-red-600"}`}>{fmtSigned(r.solde)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => exportPlayer(r)} title={U.expCSV} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><FileDown className="w-4 h-4" /></button>
                        <button onClick={() => exportPlayerPDF(r)} title={U.expPDF} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><FileText className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></CardContent></Card>
        ) : view === "agents" ? (
          /* ── Vue par agent / partenaire ── */
          <Card><CardContent className="p-0"><div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr className="text-xs text-slate-500">
                <th className="text-left px-4 py-2.5 font-medium">{U.agentPart}</th>
                <th className="text-right px-3 py-2.5 font-medium">{U.thComm}</th>
                <th className="text-right px-3 py-2.5 font-medium">{U.thSplits}</th>
                <th className="text-right px-3 py-2.5 font-medium">{FD.solde}</th>
              </tr></thead>
              <tbody>
                {perAgent.map((r) => (
                  <tr key={r.key} className="border-t border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{r.name}<span className="text-[11px] text-slate-400 font-normal"> · {r.n} {r.n > 1 ? U.lignesP : U.lignes}</span></td>
                    <td className="px-3 py-2.5 text-right text-green-700">{fmtMoney(r.entree)}</td>
                    <td className="px-3 py-2.5 text-right text-red-600">{fmtMoney(r.sortie)}</td>
                    <td className={`px-3 py-2.5 text-right font-bold ${r.solde >= 0 ? "text-green-700" : "text-red-600"}`}>{fmtSigned(r.solde)}</td>
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
                <th className="text-left px-4 py-2.5 font-medium">{FD.lib}</th>
                <th className="text-left px-3 py-2.5 font-medium">{FD.cat}</th>
                <th className="text-left px-3 py-2.5 font-medium">{FD.nature}</th>
                <th className="text-right px-3 py-2.5 font-medium">{FD.montant}</th>
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
                    <td className="px-3 py-2.5 text-slate-500 text-xs">{typeLabel(c.type, lang)}</td>
                    <td className="px-3 py-2.5">
                      <Badge className={`border-0 text-[11px] ${isReel(c) ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"}`}>
                        {isReel(c) ? FD.reel : FD.projection}
                      </Badge>
                    </td>
                    <td className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${isSortie(c) ? "text-red-600" : "text-green-700"}`}>
                      {isSortie(c) ? "−" : "+"}{fmtMoney(c.montant, c.devise)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {!isReel(c) && (
                          <button onClick={() => markReel(c)} title={U.markReel} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"><CheckCircle2 className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => { setEditing(c); setShowForm(true); }} title={U.edit} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm(`${U.confirmDel} "${c.titre}" ?`)) deleteMut.mutate(c.id); }} title={U.del} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
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
          lang={lang}
        />
      )}
    </div>
  );
}
