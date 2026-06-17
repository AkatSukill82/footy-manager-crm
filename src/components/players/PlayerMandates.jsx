import React, { useState } from "react";
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
import { FileSignature, FolderOpen, Plus, Loader2, Pencil, Trash2, ExternalLink } from "lucide-react";

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

function expiryState(dateISO, resilie = false) {
  if (resilie) return { key: "resilie", label: "Résilié", color: "bg-slate-100 text-slate-400" };
  const d = daysUntil(dateISO);
  if (d == null) return { key: "na", label: "—", color: "bg-slate-100 text-slate-500" };
  if (d < 0)   return { key: "expire", label: "Expiré", color: "bg-red-100 text-red-700" };
  if (d <= 90) return { key: "bientot", label: `Expire dans ${d}j`, color: "bg-amber-100 text-amber-700" };
  return { key: "ok", label: "Actif", color: "bg-green-100 text-green-700" };
}

// ── Formulaire Mandat (joueur pré-rempli) ─────────────────────────────────────

function MandateForm({ open, onClose, onSave, initial, saving }) {
  const [f, setF] = useState(() => initial || {
    type: "representation_exclusive", date_debut: "", date_fin: "",
    commission_pct: "", exclusif: true, statut: "actif", notes: "",
  });
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const submit = () => {
    if (!f.date_fin) return;
    const clean = {
      ...f,
      commission_pct: f.commission_pct === "" ? null : Number(f.commission_pct),
      exclusif: f.type === "representation_exclusive" ? true : !!f.exclusif,
    };
    Object.keys(clean).forEach(k => { if (clean[k] === "") clean[k] = null; });
    onSave(clean);
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial?.id ? "Modifier le mandat" : "Nouveau mandat"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
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
          <Button onClick={submit} disabled={saving || !f.date_fin} className="bg-slate-900 hover:bg-slate-700">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{initial?.id ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Formulaire Document (joueur pré-rempli) ───────────────────────────────────

function DocumentForm({ open, onClose, onSave, initial, saving }) {
  const [f, setF] = useState(() => initial || {
    titre: "", type: "contrat", url: "", date_expiration: "", notes: "",
  });
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e?.target ? e.target.value : e }));
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
          <div><Label className="text-xs">Titre *</Label><Input value={f.titre} onChange={set("titre")} placeholder="Ex: Passeport" /></div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={f.type} onValueChange={set("type")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
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

// ── Carte fiche joueur : Mandats & Documents ──────────────────────────────────

export default function PlayerMandates({ player }) {
  const qc = useQueryClient();
  const playerId = player?.id;
  const [showMandate, setShowMandate] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const [editMandate, setEditMandate] = useState(null);
  const [editDoc, setEditDoc] = useState(null);

  const { data: mandates = [], isLoading: loadingM } = useQuery({
    queryKey: ["mandates", "player", playerId],
    queryFn: () => base44.entities.Mandate.filter({ player_id: playerId }, "date_fin"),
    enabled: !!playerId,
  });
  const { data: documents = [], isLoading: loadingD } = useQuery({
    queryKey: ["documents", "player", playerId],
    queryFn: () => base44.entities.Document.filter({ player_id: playerId }, "date_expiration"),
    enabled: !!playerId,
  });

  const invalidate = (key) => qc.invalidateQueries({ queryKey: [key, "player", playerId] });
  // Lie automatiquement le mandat / document au joueur courant.
  const withPlayer = (d) => ({ ...d, player_id: playerId, player_nom: player?.nom || d.player_nom || null });

  const mMut = {
    create: useMutation({ mutationFn: (d) => base44.entities.Mandate.create(withPlayer(d)), onSuccess: () => { invalidate("mandates"); setShowMandate(false); setEditMandate(null); } }),
    update: useMutation({ mutationFn: ({ id, data }) => base44.entities.Mandate.update(id, data), onSuccess: () => { invalidate("mandates"); setShowMandate(false); setEditMandate(null); } }),
    del:    useMutation({ mutationFn: (id) => base44.entities.Mandate.delete(id), onSuccess: () => invalidate("mandates") }),
  };
  const dMut = {
    create: useMutation({ mutationFn: (d) => base44.entities.Document.create(withPlayer(d)), onSuccess: () => { invalidate("documents"); setShowDoc(false); setEditDoc(null); } }),
    update: useMutation({ mutationFn: ({ id, data }) => base44.entities.Document.update(id, data), onSuccess: () => { invalidate("documents"); setShowDoc(false); setEditDoc(null); } }),
    del:    useMutation({ mutationFn: (id) => base44.entities.Document.delete(id), onSuccess: () => invalidate("documents") }),
  };
  const savingM = mMut.create.isPending || mMut.update.isPending;
  const savingD = dMut.create.isPending || dMut.update.isPending;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-indigo-600" /> Mandats & Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* ── Mandats ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mandats</span>
            <Button size="sm" variant="ghost" className="h-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              onClick={() => { setEditMandate(null); setShowMandate(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter
            </Button>
          </div>
          {loadingM ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
          ) : mandates.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">Aucun mandat pour ce joueur.</p>
          ) : (
            <div className="space-y-2">
              {mandates.map(m => {
                const st = expiryState(m.date_fin, m.statut === "resilie");
                return (
                  <div key={m.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800">{label(MANDATE_TYPES, m.type)}</span>
                        <Badge className={`${st.color} border-0 text-[11px]`}>{st.label}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {m.commission_pct != null ? `${m.commission_pct}% · ` : ""}
                        {m.date_fin ? `expire le ${m.date_fin}` : "sans échéance"}
                        {m.exclusif ? " · exclusif" : ""}
                      </div>
                      {m.notes && <div className="text-xs text-slate-400 mt-0.5 truncate">{m.notes}</div>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditMandate(m); setShowMandate(true); }} className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm("Supprimer ce mandat ?")) mMut.del.mutate(m.id); }} className="p-1 rounded text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Documents ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Documents</span>
            <Button size="sm" variant="ghost" className="h-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              onClick={() => { setEditDoc(null); setShowDoc(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter
            </Button>
          </div>
          {loadingD ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
          ) : documents.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">Aucun document pour ce joueur.</p>
          ) : (
            <div className="space-y-2">
              {documents.map(d => {
                const st = expiryState(d.date_expiration);
                return (
                  <div key={d.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 group">
                    <FolderOpen className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800">{d.titre}</span>
                        {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700"><ExternalLink className="w-3.5 h-3.5" /></a>}
                        {d.date_expiration && <Badge className={`${st.color} border-0 text-[11px]`}>{st.key === "ok" ? d.date_expiration : st.label}</Badge>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{label(DOC_TYPES, d.type)}</div>
                      {d.notes && <div className="text-xs text-slate-400 mt-0.5 truncate">{d.notes}</div>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditDoc(d); setShowDoc(true); }} className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(`Supprimer "${d.titre}" ?`)) dMut.del.mutate(d.id); }} className="p-1 rounded text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>

      {showMandate && (
        <MandateForm open={showMandate} onClose={() => { setShowMandate(false); setEditMandate(null); }}
          onSave={(data) => editMandate?.id ? mMut.update.mutate({ id: editMandate.id, data }) : mMut.create.mutate(data)}
          initial={editMandate} saving={savingM} />
      )}
      {showDoc && (
        <DocumentForm open={showDoc} onClose={() => { setShowDoc(false); setEditDoc(null); }}
          onSave={(data) => editDoc?.id ? dMut.update.mutate({ id: editDoc.id, data }) : dMut.create.mutate(data)}
          initial={editDoc} saving={savingD} />
      )}
    </Card>
  );
}
