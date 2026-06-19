import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wallet, Plus, Loader2, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  Pencil, Trash2, Euro, FileText, Ban, X,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ── Référentiels ──────────────────────────────────────────────────────────────

const TYPES = [
  { v: "transfert",              label: "Transfert" },
  { v: "renouvellement_contrat", label: "Renouvellement contrat" },
  { v: "premier_contrat",        label: "Premier contrat" },
  { v: "sponsoring",             label: "Sponsoring" },
  { v: "commission_salaire",     label: "Commission sur salaire" },
  { v: "prime",                  label: "Prime" },
  { v: "autre",                  label: "Autre" },
];
const typeLabel = (v) => TYPES.find(t => t.v === v)?.label || v;

const STATUTS = {
  a_facturer: { label: "À facturer", color: "bg-slate-100 text-slate-700",   icon: FileText },
  facturee:   { label: "Facturée",   color: "bg-blue-100 text-blue-700",     icon: Clock },
  payee:      { label: "Payée",      color: "bg-green-100 text-green-700",   icon: CheckCircle2 },
  en_retard:  { label: "En retard",  color: "bg-red-100 text-red-700",       icon: AlertTriangle },
  annulee:    { label: "Annulée",    color: "bg-slate-100 text-slate-400",   icon: Ban },
};

const DEVISE_SY = { EUR: "€", GBP: "£", USD: "$" };
const fmtMoney = (n, d = "EUR") =>
  n == null ? "—" : `${Number(n).toLocaleString("fr-FR")} ${DEVISE_SY[d] || "€"}`;

const todayISO = () => new Date().toISOString().split("T")[0];

// Statut effectif : une commission non payée dont l'échéance est passée = en retard
function effectiveStatut(c) {
  if (c.statut === "payee" || c.statut === "annulee") return c.statut;
  if (c.date_echeance && c.date_echeance < todayISO()) return "en_retard";
  return c.statut;
}

const MONTHS_FR = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];

// ── Formulaire ──────────────────────────────────────────────────────────────

function CommissionForm({ open, onClose, onSave, initial, players, saving }) {
  const [f, setF] = useState(() => initial || {
    titre: "", player_id: "", player_nom: "", club: "", type: "transfert",
    montant_operation: "", taux: "", montant: "", devise: "EUR",
    statut: "a_facturer", date_echeance: "", date_paiement: "", facture_ref: "", notes: "",
  });

  const set = (k) => (e) => setF(s => ({ ...s, [k]: e?.target ? e.target.value : e }));

  // Auto-calcul du montant si opération + taux renseignés (M€ × % → €)
  const autoMontant = () => {
    const op = parseFloat(f.montant_operation), tx = parseFloat(f.taux);
    if (!isNaN(op) && !isNaN(tx)) setF(s => ({ ...s, montant: Math.round(op * 1_000_000 * tx / 100) }));
  };

  const onPlayer = (id) => {
    const p = players.find(x => x.id === id);
    setF(s => ({ ...s, player_id: id, player_nom: p?.nom || "", club: s.club || p?.club_actuel || "" }));
  };

  const submit = () => {
    if (!f.titre.trim() || f.montant === "" || f.montant == null) return;
    const clean = {
      ...f,
      montant_operation: f.montant_operation === "" ? null : Number(f.montant_operation),
      taux:              f.taux === "" ? null : Number(f.taux),
      montant:           Number(f.montant),
    };
    Object.keys(clean).forEach(k => { if (clean[k] === "") clean[k] = null; });
    onSave(clean);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Modifier la commission" : "Nouvelle commission"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Libellé *</Label>
            <Input value={f.titre} onChange={set("titre")} placeholder="Ex: Transfert J. Doe → OL" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Joueur</Label>
              <Select value={f.player_id || ""} onValueChange={onPlayer}>
                <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  {players.map(p => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={f.type} onValueChange={set("type")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Club</Label>
            <Input value={f.club} onChange={set("club")} placeholder="Club concerné" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Opération (M€)</Label>
              <Input type="number" value={f.montant_operation} onChange={set("montant_operation")} onBlur={autoMontant} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Taux (%)</Label>
              <Input type="number" value={f.taux} onChange={set("taux")} onBlur={autoMontant} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Commission (€) *</Label>
              <Input type="number" value={f.montant} onChange={set("montant")} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Statut</Label>
              <Select value={f.statut} onValueChange={set("statut")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUTS).filter(([k]) => k !== "en_retard").map(([k, v]) =>
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
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
              <Label className="text-xs">Échéance</Label>
              <Input type="date" value={f.date_echeance || ""} onChange={set("date_echeance")} />
            </div>
            <div>
              <Label className="text-xs">Date de paiement</Label>
              <Input type="date" value={f.date_paiement || ""} onChange={set("date_paiement")} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Réf. facture</Label>
            <Input value={f.facture_ref} onChange={set("facture_ref")} placeholder="FAC-2026-001" />
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={f.notes} onChange={set("notes")} rows={2} />
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
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs text-slate-500">{label}</span>
        </div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("tous");

  const { data: user } = useQuery({
    queryKey: ["currentUser"], queryFn: () => base44.auth.me(), staleTime: Infinity,
  });
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["commissions", user?.id],
    queryFn: () => base44.entities.Commission.filter({ created_by_id: user.id }, "-date_echeance"),
    enabled: !!user?.id,
  });
  const { data: players = [] } = useQuery({
    queryKey: ["players", user?.id],
    queryFn: () => base44.entities.Player.filter({ created_by_id: user.id }, "-created_date"),
    enabled: !!user?.id, staleTime: Infinity,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["commissions"] });

  const createMut = useMutation({
    // organization_id requis par la RLS de création (non auto-injecté par Base44).
    mutationFn: (data) => base44.entities.Commission.create({ ...data, organization_id: user?.organization_id ?? null }),
    onSuccess: () => { invalidate(); setShowForm(false); setEditing(null); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Commission.update(id, data),
    onSuccess: () => { invalidate(); setShowForm(false); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Commission.delete(id),
    onSuccess: invalidate,
  });

  const markPaid = (c) =>
    updateMut.mutate({ id: c.id, data: { statut: "payee", date_paiement: c.date_paiement || todayISO() } });

  // ── Agrégats (en EUR uniquement pour les KPI — devise majoritaire) ──────────
  const stats = useMemo(() => {
    let encaisse = 0, attente = 0, retard = 0, total = 0;
    const year = new Date().getFullYear();
    let cetteAnnee = 0;
    for (const c of commissions) {
      const eff = effectiveStatut(c);
      const m = Number(c.montant) || 0;
      if (eff === "annulee") continue;
      total += m;
      if (eff === "payee") {
        encaisse += m;
        if ((c.date_paiement || "").startsWith(String(year))) cetteAnnee += m;
      } else if (eff === "en_retard") {
        retard += m;
      } else {
        attente += m;
      }
    }
    return { encaisse, attente, retard, total, cetteAnnee };
  }, [commissions]);

  // ── Revenus encaissés par mois (12 derniers mois) ───────────────────────────
  const monthly = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTHS_FR[d.getMonth()], total: 0 });
    }
    const idx = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
    for (const c of commissions) {
      if (effectiveStatut(c) !== "payee" || !c.date_paiement) continue;
      const k = c.date_paiement.slice(0, 7);
      if (k in idx) buckets[idx[k]].total += Number(c.montant) || 0;
    }
    return buckets;
  }, [commissions]);

  const filtered = useMemo(() => {
    if (filter === "tous") return commissions;
    return commissions.filter(c => effectiveStatut(c) === filter);
  }, [commissions, filter]);

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-7 h-7 text-green-600" /> Finance & Commissions
            </h1>
            <p className="text-xs text-slate-500 mt-1">Suivi des commissions, échéances de paiement et revenus.</p>
          </div>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" /> Nouvelle commission
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi icon={CheckCircle2} label="Encaissé" value={fmtMoney(stats.encaisse)} sub={`${fmtMoney(stats.cetteAnnee)} cette année`} color="bg-green-100 text-green-700" />
          <Kpi icon={Clock} label="En attente" value={fmtMoney(stats.attente)} color="bg-blue-100 text-blue-700" />
          <Kpi icon={AlertTriangle} label="En retard" value={fmtMoney(stats.retard)} color="bg-red-100 text-red-700" />
          <Kpi icon={TrendingUp} label="Total portefeuille" value={fmtMoney(stats.total)} color="bg-slate-200 text-slate-700" />
        </div>

        {/* Graphe revenus */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Euro className="w-4 h-4 text-green-600" /> Revenus encaissés (12 mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
                <Tooltip formatter={(v) => fmtMoney(v)} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {monthly.map((m, i) => <Cell key={i} fill="#22c55e" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Filtres */}
        <div className="flex items-center gap-2 flex-wrap">
          {["tous", "a_facturer", "facturee", "payee", "en_retard", "annulee"].map(k => (
            <button key={k} onClick={() => setFilter(k)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filter === k ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}>
              {k === "tous" ? "Tous" : STATUTS[k].label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-green-500 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-slate-400">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            {commissions.length === 0 ? "Aucune commission enregistrée. Créez-en une pour suivre vos revenus." : "Aucune commission dans ce filtre."}
          </CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-xs text-slate-500">
                      <th className="text-left px-4 py-2.5 font-medium">Commission</th>
                      <th className="text-left px-3 py-2.5 font-medium">Type</th>
                      <th className="text-right px-3 py-2.5 font-medium">Montant</th>
                      <th className="text-left px-3 py-2.5 font-medium">Échéance</th>
                      <th className="text-left px-3 py-2.5 font-medium">Statut</th>
                      <th className="px-3 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => {
                      const eff = effectiveStatut(c);
                      const st = STATUTS[eff];
                      const StIcon = st.icon;
                      return (
                        <tr key={c.id} className="border-t border-slate-50 hover:bg-slate-50/60">
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-slate-800">{c.titre}</div>
                            <div className="text-[11px] text-slate-400">
                              {[c.player_nom, c.club].filter(Boolean).join(" · ") || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 text-xs">{typeLabel(c.type)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                            {fmtMoney(c.montant, c.devise)}
                            {c.taux ? <div className="text-[10px] text-slate-400 font-normal">{c.taux}%</div> : null}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{c.date_echeance || "—"}</td>
                          <td className="px-3 py-2.5">
                            <Badge className={`${st.color} border-0 text-[11px] gap-1`}>
                              <StIcon className="w-3 h-3" /> {st.label}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              {eff !== "payee" && eff !== "annulee" && (
                                <button onClick={() => markPaid(c)} title="Marquer payée"
                                  className="p-1.5 rounded-lg text-green-600 hover:bg-green-50">
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => { setEditing(c); setShowForm(true); }} title="Modifier"
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => { if (confirm(`Supprimer "${c.titre}" ?`)) deleteMut.mutate(c.id); }} title="Supprimer"
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showForm && (
        <CommissionForm
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
