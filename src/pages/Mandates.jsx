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
  FileSignature, FolderOpen, Plus, Loader2, Pencil, Trash2, ExternalLink,
  AlertTriangle, CheckCircle2, Clock, ShieldCheck,
} from "lucide-react";

// ── Référentiels ──────────────────────────────────────────────────────────────

const MANDATE_TYPES = [
  { v: "representation_exclusive",     label: "Représentation exclusive" },
  { v: "representation_non_exclusive", label: "Représentation non-exclusive" },
  { v: "droits_image",                 label: "Droits à l'image" },
  { v: "mandat_ponctuel",              label: "Mandat ponctuel" },
];
const DOC_TYPES = [
  { v: "contrat",            label: "Contrat" },
  { v: "passeport",          label: "Passeport" },
  { v: "carte_identite",     label: "Carte d'identité" },
  { v: "permis_travail",     label: "Permis de travail" },
  { v: "visa",               label: "Visa" },
  { v: "certificat_medical", label: "Certificat médical" },
  { v: "licence",            label: "Licence" },
  { v: "autre",              label: "Autre" },
];
const label = (list, v) => list.find(x => x.v === v)?.label || v;

const todayISO = () => new Date().toISOString().split("T")[0];
const daysUntil = (iso) => iso ? Math.floor((new Date(iso) - new Date(todayISO())) / 86400000) : null;

// Statut d'expiration → { key, label, color }
function expiryState(dateISO, resilie = false) {
  if (resilie) return { key: "resilie", label: "Résilié", color: "bg-slate-100 text-slate-400" };
  const d = daysUntil(dateISO);
  if (d == null) return { key: "na", label: "—", color: "bg-slate-100 text-slate-500" };
  if (d < 0)   return { key: "expire", label: "Expiré", color: "bg-red-100 text-red-700" };
  if (d <= 90) return { key: "bientot", label: `Expire dans ${d}j`, color: "bg-amber-100 text-amber-700" };
  return { key: "ok", label: "Actif", color: "bg-green-100 text-green-700" };
}

// ── Formulaire Mandat ───────────────────────────────────────────────────────

function MandateForm({ open, onClose, onSave, initial, players, saving }) {
  const [f, setF] = useState(() => initial || {
    player_id: "", player_nom: "", type: "representation_exclusive",
    date_debut: "", date_fin: "", commission_pct: "", exclusif: true, statut: "actif", notes: "",
  });
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const onPlayer = (id) => {
    const p = players.find(x => x.id === id);
    setF(s => ({ ...s, player_id: id, player_nom: p?.nom || s.player_nom }));
  };
  const submit = () => {
    if (!f.player_nom?.trim() || !f.date_fin) return;
    const clean = { ...f, commission_pct: f.commission_pct === "" ? null : Number(f.commission_pct), exclusif: f.type === "representation_exclusive" ? true : !!f.exclusif };
    Object.keys(clean).forEach(k => { if (clean[k] === "") clean[k] = null; });
    onSave(clean);
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial?.id ? "Modifier le mandat" : "Nouveau mandat"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Joueur</Label>
              <Select value={f.player_id || ""} onValueChange={onPlayer}>
                <SelectTrigger><SelectValue placeholder="Choisir / saisir" /></SelectTrigger>
                <SelectContent>{players.map(p => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Nom joueur *</Label>
              <Input value={f.player_nom} onChange={set("player_nom")} placeholder="Nom" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Type de mandat</Label>
            <Select value={f.type} onValueChange={set("type")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MANDATE_TYPES.map(t => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Début</Label><Input type="date" value={f.date_debut || ""} onChange={set("date_debut")} /></div>
            <div><Label className="text-xs">Expiration *</Label><Input type="date" value={f.date_fin || ""} onChange={set("date_fin")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Commission (%)</Label><Input type="number" value={f.commission_pct} onChange={set("commission_pct")} placeholder="10" /></div>
            <div>
              <Label className="text-xs">Statut</Label>
              <Select value={f.statut} onValueChange={set("statut")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="resilie">Résilié</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">Notes</Label><Textarea value={f.notes} onChange={set("notes")} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} disabled={saving || !f.player_nom?.trim() || !f.date_fin} className="bg-slate-900 hover:bg-slate-700">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{initial?.id ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Formulaire Document ─────────────────────────────────────────────────────

function DocumentForm({ open, onClose, onSave, initial, players, saving }) {
  const [f, setF] = useState(() => initial || {
    titre: "", player_id: "", player_nom: "", type: "contrat", url: "", date_expiration: "", notes: "",
  });
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const onPlayer = (id) => {
    const p = players.find(x => x.id === id);
    setF(s => ({ ...s, player_id: id, player_nom: p?.nom || s.player_nom }));
  };
  const submit = () => {
    if (!f.titre?.trim()) return;
    const clean = { ...f };
    Object.keys(clean).forEach(k => { if (clean[k] === "") clean[k] = null; });
    onSave(clean);
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial?.id ? "Modifier le document" : "Nouveau document"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label className="text-xs">Titre *</Label><Input value={f.titre} onChange={set("titre")} placeholder="Ex: Passeport J. Doe" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Joueur</Label>
              <Select value={f.player_id || ""} onValueChange={onPlayer}>
                <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>{players.map(p => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={f.type} onValueChange={set("type")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">Lien du document (Drive, Dropbox…)</Label><Input value={f.url} onChange={set("url")} placeholder="https://…" /></div>
          <div><Label className="text-xs">Date d'expiration (passeport, permis…)</Label><Input type="date" value={f.date_expiration || ""} onChange={set("date_expiration")} /></div>
          <div><Label className="text-xs">Notes</Label><Textarea value={f.notes} onChange={set("notes")} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} disabled={saving || !f.titre?.trim()} className="bg-slate-900 hover:bg-slate-700">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{initial?.id ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Kpi({ icon: Icon, label, value, color }) {
  return (
    <Card><CardContent className="pt-5">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-4 h-4" /></div>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </CardContent></Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MandatesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("mandats");
  const [showMandate, setShowMandate] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const [editMandate, setEditMandate] = useState(null);
  const [editDoc, setEditDoc] = useState(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me(), staleTime: Infinity });
  const { data: players = [] } = useQuery({
    queryKey: ["players", user?.id],
    queryFn: () => base44.entities.Player.filter({ created_by_id: user.id }, "-created_date"),
    enabled: !!user?.id, staleTime: Infinity,
  });
  const { data: mandates = [], isLoading: loadingM } = useQuery({
    queryKey: ["mandates", user?.id],
    queryFn: () => base44.entities.Mandate.filter({ created_by_id: user.id }, "date_fin"),
    enabled: !!user?.id,
  });
  const { data: documents = [], isLoading: loadingD } = useQuery({
    queryKey: ["documents", user?.id],
    queryFn: () => base44.entities.Document.filter({ created_by_id: user.id }, "date_expiration"),
    enabled: !!user?.id,
  });

  const mMut = {
    create: useMutation({ mutationFn: (d) => base44.entities.Mandate.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["mandates"] }); setShowMandate(false); setEditMandate(null); } }),
    update: useMutation({ mutationFn: ({ id, data }) => base44.entities.Mandate.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["mandates"] }); setShowMandate(false); setEditMandate(null); } }),
    del:    useMutation({ mutationFn: (id) => base44.entities.Mandate.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["mandates"] }) }),
  };
  const dMut = {
    create: useMutation({ mutationFn: (d) => base44.entities.Document.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); setShowDoc(false); setEditDoc(null); } }),
    update: useMutation({ mutationFn: ({ id, data }) => base44.entities.Document.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); setShowDoc(false); setEditDoc(null); } }),
    del:    useMutation({ mutationFn: (id) => base44.entities.Document.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }) }),
  };

  const kpis = useMemo(() => {
    const actifs = mandates.filter(m => m.statut !== "resilie" && daysUntil(m.date_fin) >= 0).length;
    const mExp = mandates.filter(m => m.statut !== "resilie" && daysUntil(m.date_fin) != null && daysUntil(m.date_fin) >= 0 && daysUntil(m.date_fin) <= 90).length;
    const dExp = documents.filter(d => { const x = daysUntil(d.date_expiration); return x != null && x >= 0 && x <= 90; }).length;
    const expired = mandates.filter(m => m.statut !== "resilie" && daysUntil(m.date_fin) < 0).length
                  + documents.filter(d => { const x = daysUntil(d.date_expiration); return x != null && x < 0; }).length;
    return { actifs, mExp, dExp, expired };
  }, [mandates, documents]);

  const savingM = mMut.create.isPending || mMut.update.isPending;
  const savingD = dMut.create.isPending || dMut.update.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FileSignature className="w-7 h-7 text-indigo-600" /> Mandats & Documents
          </h1>
          <p className="text-xs text-slate-500 mt-1">Suivi des mandats, alertes d'expiration et coffre-fort de documents.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi icon={ShieldCheck} label="Mandats actifs" value={kpis.actifs} color="bg-green-100 text-green-700" />
          <Kpi icon={Clock} label="Mandats expirant <90j" value={kpis.mExp} color="bg-amber-100 text-amber-700" />
          <Kpi icon={Clock} label="Documents expirant <90j" value={kpis.dExp} color="bg-amber-100 text-amber-700" />
          <Kpi icon={AlertTriangle} label="Expirés" value={kpis.expired} color="bg-red-100 text-red-700" />
        </div>

        {/* Onglets */}
        <div className="flex items-center gap-2">
          {[["mandats", "Mandats", FileSignature], ["documents", "Documents", FolderOpen]].map(([k, lbl, Icon]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium transition-colors ${
                tab === k ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}>
              <Icon className="w-4 h-4" /> {lbl}
            </button>
          ))}
          <div className="ml-auto">
            {tab === "mandats"
              ? <Button onClick={() => { setEditMandate(null); setShowMandate(true); }} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" />Mandat</Button>
              : <Button onClick={() => { setEditDoc(null); setShowDoc(true); }} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" />Document</Button>}
          </div>
        </div>

        {/* ── MANDATS ── */}
        {tab === "mandats" && (
          loadingM ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
          : mandates.length === 0 ? <Card><CardContent className="py-16 text-center text-slate-400"><FileSignature className="w-8 h-8 mx-auto mb-2 text-slate-300" />Aucun mandat. Ajoutez vos mandats pour suivre leurs échéances.</CardContent></Card>
          : <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-slate-50"><tr className="text-xs text-slate-500">
                <th className="text-left px-4 py-2.5 font-medium">Joueur</th>
                <th className="text-left px-3 py-2.5 font-medium">Type</th>
                <th className="text-left px-3 py-2.5 font-medium">Commission</th>
                <th className="text-left px-3 py-2.5 font-medium">Expiration</th>
                <th className="text-left px-3 py-2.5 font-medium">Statut</th>
                <th className="px-3 py-2.5"></th>
              </tr></thead>
              <tbody>{mandates.map(m => {
                const st = expiryState(m.date_fin, m.statut === "resilie");
                return (
                  <tr key={m.id} className="border-t border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{m.player_nom}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{label(MANDATE_TYPES, m.type)}{m.exclusif ? " · exclusif" : ""}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{m.commission_pct != null ? `${m.commission_pct}%` : "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{m.date_fin || "—"}</td>
                    <td className="px-3 py-2.5"><Badge className={`${st.color} border-0 text-[11px]`}>{st.label}</Badge></td>
                    <td className="px-3 py-2.5"><div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditMandate(m); setShowMandate(true); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm(`Supprimer le mandat de ${m.player_nom} ?`)) mMut.del.mutate(m.id); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div></td>
                  </tr>
                );
              })}</tbody>
            </table></div></CardContent></Card>
        )}

        {/* ── DOCUMENTS ── */}
        {tab === "documents" && (
          loadingD ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
          : documents.length === 0 ? <Card><CardContent className="py-16 text-center text-slate-400"><FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />Aucun document. Ajoutez contrats, passeports, permis de travail…</CardContent></Card>
          : <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-slate-50"><tr className="text-xs text-slate-500">
                <th className="text-left px-4 py-2.5 font-medium">Document</th>
                <th className="text-left px-3 py-2.5 font-medium">Type</th>
                <th className="text-left px-3 py-2.5 font-medium">Joueur</th>
                <th className="text-left px-3 py-2.5 font-medium">Expiration</th>
                <th className="px-3 py-2.5"></th>
              </tr></thead>
              <tbody>{documents.map(d => {
                const st = expiryState(d.date_expiration);
                return (
                  <tr key={d.id} className="border-t border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        {d.titre}
                        {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700"><ExternalLink className="w-3.5 h-3.5" /></a>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{label(DOC_TYPES, d.type)}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{d.player_nom || "—"}</td>
                    <td className="px-3 py-2.5">{d.date_expiration ? <Badge className={`${st.color} border-0 text-[11px]`}>{st.key === "ok" ? d.date_expiration : st.label}</Badge> : <span className="text-xs text-slate-400">—</span>}</td>
                    <td className="px-3 py-2.5"><div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditDoc(d); setShowDoc(true); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm(`Supprimer "${d.titre}" ?`)) dMut.del.mutate(d.id); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div></td>
                  </tr>
                );
              })}</tbody>
            </table></div></CardContent></Card>
        )}
      </div>

      {showMandate && (
        <MandateForm open={showMandate} onClose={() => { setShowMandate(false); setEditMandate(null); }}
          onSave={(data) => editMandate?.id ? mMut.update.mutate({ id: editMandate.id, data }) : mMut.create.mutate(data)}
          initial={editMandate} players={players} saving={savingM} />
      )}
      {showDoc && (
        <DocumentForm open={showDoc} onClose={() => { setShowDoc(false); setEditDoc(null); }}
          onSave={(data) => editDoc?.id ? dMut.update.mutate({ id: editDoc.id, data }) : dMut.create.mutate(data)}
          initial={editDoc} players={players} saving={savingD} />
      )}
    </div>
  );
}
