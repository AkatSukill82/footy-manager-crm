import React, { useState, useRef } from "react";
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
import { FileSignature, FolderOpen, Plus, Loader2, Pencil, Trash2, ExternalLink, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";
import { useCurrentUser } from "../../lib/useCurrentUser";

// ── Référentiels (codes ; libellés traduits via session.mandates.*) ───────────

const MANDATE_TYPE_CODES = ["representation_exclusive", "representation_non_exclusive", "droits_image", "mandat_ponctuel"];
const DOC_TYPE_CODES = ["contrat", "passeport", "carte_identite", "permis_travail", "visa", "certificat_medical", "licence", "autre"];
const mtypeLabel = (lang, v) => t(lang, `session.mandates.mtypes.${v}`);
const dtypeLabel = (lang, v) => t(lang, `session.mandates.dtypes.${v}`);

const todayISO = () => new Date().toISOString().split("T")[0];
const daysUntil = (iso) => iso ? Math.floor((new Date(iso) - new Date(todayISO())) / 86400000) : null;

// Renvoie l'état + la couleur ; le libellé est traduit via expiryLabel().
function expiryState(dateISO, resilie = false) {
  if (resilie) return { key: "resilie", d: null, color: "bg-slate-100 text-slate-400" };
  const d = daysUntil(dateISO);
  if (d == null) return { key: "na", d: null, color: "bg-slate-100 text-slate-500" };
  if (d < 0)   return { key: "expire", d, color: "bg-red-100 text-red-700" };
  if (d <= 90) return { key: "bientot", d, color: "bg-amber-100 text-amber-700" };
  return { key: "ok", d, color: "bg-green-100 text-green-700" };
}
function expiryLabel(lang, st) {
  switch (st.key) {
    case "resilie": return t(lang, "session.mandates.badges.terminated");
    case "expire":  return t(lang, "session.mandates.badges.expired");
    case "bientot": return t(lang, "session.mandates.badges.expiresIn", { d: st.d });
    case "ok":      return t(lang, "session.mandates.badges.active");
    default:        return "—";
  }
}

// ── Formulaire Mandat (joueur pré-rempli) ─────────────────────────────────────

function MandateForm({ open, onClose, onSave, initial, saving }) {
  const { lang } = useLanguage();
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
        <DialogHeader><DialogTitle>{initial?.id ? t(lang, "session.mandates.editMandate") : t(lang, "session.mandates.newMandate")}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">{t(lang, "session.mandates.type")}</Label>
            <Select value={f.type} onValueChange={set("type")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MANDATE_TYPE_CODES.map(code => <SelectItem key={code} value={code}>{mtypeLabel(lang, code)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">{t(lang, "session.mandates.start")}</Label><Input type="date" value={f.date_debut || ""} onChange={set("date_debut")} /></div>
            <div><Label className="text-xs">{t(lang, "session.mandates.expiry")} *</Label><Input type="date" value={f.date_fin || ""} onChange={set("date_fin")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">{t(lang, "session.mandates.commission")}</Label><Input type="number" value={f.commission_pct} onChange={set("commission_pct")} placeholder="10" /></div>
            <div>
              <Label className="text-xs">{t(lang, "session.mandates.status")}</Label>
              <Select value={f.statut} onValueChange={set("statut")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">{t(lang, "session.mandates.active")}</SelectItem>
                  <SelectItem value="resilie">{t(lang, "session.mandates.terminated")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">{t(lang, "session.mandates.notes")}</Label><Textarea value={f.notes} onChange={set("notes")} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t(lang, "common.cancel")}</Button>
          <Button onClick={submit} disabled={saving || !f.date_fin} className="bg-slate-900 hover:bg-slate-700">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{initial?.id ? t(lang, "common.save") : t(lang, "common.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Formulaire Document (joueur pré-rempli) ───────────────────────────────────

function DocumentForm({ open, onClose, onSave, initial, saving }) {
  const { lang } = useLanguage();
  const [f, setF] = useState(() => initial || {
    titre: "", type: "contrat", url: "", date_expiration: "", notes: "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileRef = useRef(null);
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e?.target ? e.target.value : e }));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error("upload vide");
      // Le fichier hébergé devient le lien du document ; titre pré-rempli si vide.
      setF(s => ({ ...s, url: file_url, titre: s.titre?.trim() ? s.titre : file.name }));
    } catch {
      setUploadError(t(lang, "session.mandates.uploadError"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
        <DialogHeader><DialogTitle>{initial?.id ? t(lang, "session.mandates.editDoc") : t(lang, "session.mandates.newDoc")}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label className="text-xs">{t(lang, "session.mandates.docTitleLabel")} *</Label><Input value={f.titre} onChange={set("titre")} placeholder="Ex: Passeport" /></div>
          <div>
            <Label className="text-xs">{t(lang, "session.mandates.docType")}</Label>
            <Select value={f.type} onValueChange={set("type")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_TYPE_CODES.map(code => <SelectItem key={code} value={code}>{dtypeLabel(lang, code)}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Fichier : importer depuis le PC OU coller un lien */}
          <div>
            <Label className="text-xs">{t(lang, "session.mandates.file")}</Label>
            <input ref={fileRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.csv,.txt"
              onChange={handleFile} />
            <Button type="button" variant="outline" className="w-full justify-start mt-1"
              onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t(lang, "session.mandates.importing")}</>
                : <><Upload className="w-4 h-4 mr-2" /> {t(lang, "session.mandates.importFile")}</>}
            </Button>
            {f.url && !uploading && (
              <a href={f.url} target="_blank" rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> {t(lang, "session.mandates.fileAttached")} <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
          </div>
          <div>
            <Label className="text-xs">{t(lang, "session.mandates.orLink")}</Label>
            <Input value={f.url || ""} onChange={set("url")} placeholder="https://…" />
          </div>

          <div><Label className="text-xs">{t(lang, "session.mandates.expiryDate")}</Label><Input type="date" value={f.date_expiration || ""} onChange={set("date_expiration")} /></div>
          <div><Label className="text-xs">{t(lang, "session.mandates.notes")}</Label><Textarea value={f.notes} onChange={set("notes")} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t(lang, "common.cancel")}</Button>
          <Button onClick={submit} disabled={saving || uploading || !f.titre?.trim()} className="bg-slate-900 hover:bg-slate-700">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{initial?.id ? t(lang, "common.save") : t(lang, "common.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Carte fiche joueur : Mandats & Documents ──────────────────────────────────

export default function PlayerMandates({ player }) {
  const { lang } = useLanguage();
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const playerId = player?.id;
  const [showMandate, setShowMandate] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const [editMandate, setEditMandate] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [error, setError] = useState(null);
  const onErr = (e) => setError(e?.message || "Opération impossible.");

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
  // organization_id requis par la RLS de création (non auto-injecté par Base44).
  const withPlayer = (d) => ({ ...d, player_id: playerId, player_nom: player?.nom || d.player_nom || null, organization_id: currentUser?.organization_id ?? null });

  const mMut = {
    create: useMutation({ mutationFn: (d) => base44.entities.Mandate.create(withPlayer(d)), onSuccess: () => { invalidate("mandates"); setShowMandate(false); setEditMandate(null); }, onError: onErr }),
    update: useMutation({ mutationFn: ({ id, data }) => base44.entities.Mandate.update(id, data), onSuccess: () => { invalidate("mandates"); setShowMandate(false); setEditMandate(null); }, onError: onErr }),
    del:    useMutation({ mutationFn: (id) => base44.entities.Mandate.delete(id), onSuccess: () => invalidate("mandates"), onError: onErr }),
  };
  const dMut = {
    create: useMutation({ mutationFn: (d) => base44.entities.Document.create(withPlayer(d)), onSuccess: () => { invalidate("documents"); setShowDoc(false); setEditDoc(null); }, onError: onErr }),
    update: useMutation({ mutationFn: ({ id, data }) => base44.entities.Document.update(id, data), onSuccess: () => { invalidate("documents"); setShowDoc(false); setEditDoc(null); }, onError: onErr }),
    del:    useMutation({ mutationFn: (id) => base44.entities.Document.delete(id), onSuccess: () => invalidate("documents"), onError: onErr }),
  };
  const savingM = mMut.create.isPending || mMut.update.isPending;
  const savingD = dMut.create.isPending || dMut.update.isPending;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-indigo-600" /> {t(lang, "session.mandates.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ── Mandats ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t(lang, "session.mandates.mandates")}</span>
            <Button size="sm" variant="ghost" className="h-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              onClick={() => { setEditMandate(null); setShowMandate(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> {t(lang, "session.mandates.add")}
            </Button>
          </div>
          {loadingM ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
          ) : mandates.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">{t(lang, "session.mandates.noMandates")}</p>
          ) : (
            <div className="space-y-2">
              {mandates.map(m => {
                const st = expiryState(m.date_fin, m.statut === "resilie");
                return (
                  <div key={m.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800">{mtypeLabel(lang, m.type)}</span>
                        <Badge className={`${st.color} border-0 text-[11px]`}>{expiryLabel(lang, st)}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {m.commission_pct != null ? `${m.commission_pct}% · ` : ""}
                        {m.date_fin ? `${t(lang, "session.mandates.expiresOn")} ${m.date_fin}` : t(lang, "session.mandates.noExpiry")}
                        {m.exclusif ? ` · ${t(lang, "session.mandates.exclusive")}` : ""}
                      </div>
                      {m.notes && <div className="text-xs text-slate-400 mt-0.5 truncate">{m.notes}</div>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditMandate(m); setShowMandate(true); }} className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(t(lang, "session.mandates.confirmMandate"))) mMut.del.mutate(m.id); }} className="p-1 rounded text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
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
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t(lang, "session.mandates.documents")}</span>
            <Button size="sm" variant="ghost" className="h-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              onClick={() => { setEditDoc(null); setShowDoc(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> {t(lang, "session.mandates.add")}
            </Button>
          </div>
          {loadingD ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
          ) : documents.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">{t(lang, "session.mandates.noDocs")}</p>
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
                        {d.date_expiration && <Badge className={`${st.color} border-0 text-[11px]`}>{st.key === "ok" ? d.date_expiration : expiryLabel(lang, st)}</Badge>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{dtypeLabel(lang, d.type)}</div>
                      {d.notes && <div className="text-xs text-slate-400 mt-0.5 truncate">{d.notes}</div>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditDoc(d); setShowDoc(true); }} className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(t(lang, "session.mandates.confirmDoc"))) dMut.del.mutate(d.id); }} className="p-1 rounded text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
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
