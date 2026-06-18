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
  Store, Plus, Loader2, Pencil, Trash2, ArrowUpRight, Search as SearchIcon,
  TrendingUp, Users, MapPin, Euro, Phone,
} from "lucide-react";

const TRANSFERT = [
  { v: "indifferent",   label: "Indifférent" },
  { v: "transfert_sec", label: "Transfert sec" },
  { v: "pret",          label: "Prêt" },
  { v: "fin_contrat",   label: "Fin de contrat" },
];
const STATUTS = {
  ouverte:       { label: "Ouverte",       color: "bg-green-100 text-green-700" },
  en_discussion: { label: "En discussion", color: "bg-amber-100 text-amber-700" },
  cloturee:      { label: "Clôturée",      color: "bg-slate-100 text-slate-400" },
};
const tLabel = (v) => TRANSFERT.find(t => t.v === v)?.label || v;

function OppForm({ open, onClose, onSave, initial, players, saving, error }) {
  const [f, setF] = useState(() => initial || {
    type: "offre", titre: "", player_id: "", player_nom: "", poste: "", club: "",
    nationalite: "", pied_fort: "", age_min: "", age_max: "", valeur: "", budget_max: "",
    type_transfert: "indifferent", description: "", contact: "", statut: "ouverte", date_limite: "",
  });
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const onPlayer = (id) => {
    const p = players.find(x => x.id === id);
    setF(s => ({ ...s, player_id: id, player_nom: p?.nom || s.player_nom, poste: s.poste || p?.poste || "", nationalite: s.nationalite || p?.nationalite || "", valeur: s.valeur || p?.valeur_marchande || "" }));
  };
  const isOffre = f.type === "offre";
  const submit = () => {
    if (!f.titre.trim()) return;
    const clean = { ...f };
    ["age_min", "age_max", "valeur", "budget_max"].forEach(k => { clean[k] = clean[k] === "" ? null : Number(clean[k]); });
    Object.keys(clean).forEach(k => { if (clean[k] === "") clean[k] = null; });
    onSave(clean);
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial?.id ? "Modifier l'annonce" : "Nouvelle annonce"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-2">
            {[["offre", "Je propose un joueur"], ["recherche", "Je recherche un profil"]].map(([v, lbl]) => (
              <button key={v} onClick={() => set("type")(v)}
                className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${
                  f.type === v ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}>{lbl}</button>
            ))}
          </div>

          <div><Label className="text-xs">Titre *</Label><Input value={f.titre} onChange={set("titre")} placeholder={isOffre ? "Ex: Attaquant 22 ans disponible" : "Ex: Cherche latéral gauche L2"} /></div>

          {isOffre && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Joueur</Label>
                <Select value={f.player_id || ""} onValueChange={onPlayer}>
                  <SelectTrigger><SelectValue placeholder="Lier un joueur" /></SelectTrigger>
                  <SelectContent>{players.map(p => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Nom joueur</Label><Input value={f.player_nom} onChange={set("player_nom")} /></div>
            </div>
          )}
          {!isOffre && (
            <div><Label className="text-xs">Club demandeur</Label><Input value={f.club} onChange={set("club")} placeholder="Nom du club" /></div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Poste</Label><Input value={f.poste} onChange={set("poste")} placeholder="Ex: Ailier droit" /></div>
            <div><Label className="text-xs">Nationalité</Label><Input value={f.nationalite} onChange={set("nationalite")} /></div>
          </div>

          {!isOffre && (
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Âge min</Label><Input type="number" value={f.age_min} onChange={set("age_min")} /></div>
              <div><Label className="text-xs">Âge max</Label><Input type="number" value={f.age_max} onChange={set("age_max")} /></div>
              <div><Label className="text-xs">Budget max (M€)</Label><Input type="number" value={f.budget_max} onChange={set("budget_max")} /></div>
            </div>
          )}
          {isOffre && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Valeur / prix (M€)</Label><Input type="number" value={f.valeur} onChange={set("valeur")} /></div>
              <div>
                <Label className="text-xs">Pied fort</Label>
                <Select value={f.pied_fort || ""} onValueChange={set("pied_fort")}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent><SelectItem value="Droit">Droit</SelectItem><SelectItem value="Gauche">Gauche</SelectItem><SelectItem value="Les deux">Les deux</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type de transaction</Label>
              <Select value={f.type_transfert} onValueChange={set("type_transfert")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRANSFERT.map(t => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Statut</Label>
              <Select value={f.statut} onValueChange={set("statut")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STATUTS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div><Label className="text-xs">Description</Label><Textarea value={f.description} onChange={set("description")} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Contact</Label><Input value={f.contact} onChange={set("contact")} placeholder="Nom / email / tél" /></div>
            <div><Label className="text-xs">Date limite</Label><Input type="date" value={f.date_limite || ""} onChange={set("date_limite")} /></div>
          </div>
        </div>
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <span className="flex-1">{error}</span>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} disabled={saving || !f.titre.trim()} className="bg-slate-900 hover:bg-slate-700">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{initial?.id ? "Enregistrer" : "Publier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OppCard({ o, onEdit, onDelete }) {
  const isOffre = o.type === "offre";
  const st = STATUTS[o.statut] || STATUTS.ouverte;
  return (
    <Card className="overflow-hidden">
      <div className={`h-1 ${isOffre ? "bg-green-500" : "bg-blue-500"}`} />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`text-[10px] border-0 ${isOffre ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                {isOffre ? <><ArrowUpRight className="w-3 h-3 mr-0.5" />Offre</> : <><SearchIcon className="w-3 h-3 mr-0.5" />Recherche</>}
              </Badge>
              <Badge className={`text-[10px] border-0 ${st.color}`}>{st.label}</Badge>
            </div>
            <p className="font-bold text-slate-900 truncate">{o.titre}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onEdit(o)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => onDelete(o.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
          {o.poste && <span className="flex items-center gap-1 text-slate-600"><Users className="w-3 h-3 text-slate-400" />{o.poste}</span>}
          {o.player_nom && isOffre && <span className="text-slate-600">· {o.player_nom}</span>}
          {o.club && !isOffre && <span className="text-slate-600">· {o.club}</span>}
          {o.nationalite && <span className="flex items-center gap-1 text-slate-500"><MapPin className="w-3 h-3" />{o.nationalite}</span>}
          {(o.age_min || o.age_max) && <span className="text-slate-500">· {o.age_min || "?"}-{o.age_max || "?"} ans</span>}
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {isOffre && o.valeur != null && <Badge variant="outline" className="text-[11px] gap-1"><Euro className="w-3 h-3" />{o.valeur} M€</Badge>}
          {!isOffre && o.budget_max != null && <Badge variant="outline" className="text-[11px] gap-1"><Euro className="w-3 h-3" />Budget {o.budget_max} M€</Badge>}
          {o.type_transfert && o.type_transfert !== "indifferent" && <Badge variant="outline" className="text-[11px]">{tLabel(o.type_transfert)}</Badge>}
        </div>

        {o.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{o.description}</p>}

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
          {o.contact
            ? <span className="flex items-center gap-1 text-xs text-slate-600"><Phone className="w-3 h-3 text-slate-400" />{o.contact}</span>
            : <span />}
          {o.date_limite && <span className="text-[10px] text-slate-400">jusqu'au {o.date_limite}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketplacePage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState("offre");
  const [q, setQ] = useState("");

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me(), staleTime: Infinity });
  const { data: players = [] } = useQuery({
    queryKey: ["players", user?.id],
    queryFn: () => base44.entities.Player.filter({ created_by_id: user.id }, "-created_date"),
    enabled: !!user?.id, staleTime: Infinity,
  });
  const { data: opps = [], isLoading } = useQuery({
    queryKey: ["opportunities", user?.id],
    queryFn: () => base44.entities.Opportunity.list("-created_date"),
    enabled: !!user?.id,
  });

  const [formError, setFormError] = useState(null);

  const inval = () => qc.invalidateQueries({ queryKey: ["opportunities"] });
  const onErr = (err) => setFormError(err?.message || "Échec de l'enregistrement de l'annonce. Réessayez.");
  const createMut = useMutation({ mutationFn: (d) => base44.entities.Opportunity.create(d), onSuccess: () => { setFormError(null); inval(); setShowForm(false); setEditing(null); }, onError: onErr });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => base44.entities.Opportunity.update(id, data), onSuccess: () => { setFormError(null); inval(); setShowForm(false); setEditing(null); }, onError: onErr });
  const deleteMut = useMutation({ mutationFn: (id) => base44.entities.Opportunity.delete(id), onSuccess: inval, onError: onErr });

  // Rattache l'annonce à l'organisation de l'agent si elle existe (sinon création solo).
  const withOrg = (d) => ({ ...d, organization_id: user?.organization_id ?? null });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return opps.filter(o => o.type === tab && (!term ||
      [o.titre, o.poste, o.player_nom, o.club, o.nationalite, o.description].some(x => (x || "").toLowerCase().includes(term))));
  }, [opps, tab, q]);

  const counts = useMemo(() => ({
    offre: opps.filter(o => o.type === "offre").length,
    recherche: opps.filter(o => o.type === "recherche").length,
  }), [opps]);

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-7 h-7 text-violet-600" /> Marketplace
            </h1>
            <p className="text-xs text-slate-500 mt-1">Bourse d'opportunités : joueurs disponibles et profils recherchés.</p>
          </div>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4 mr-2" /> Publier une annonce
          </Button>
        </div>

        {/* Onglets + recherche */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setTab("offre")}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium transition-colors ${tab === "offre" ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
            <ArrowUpRight className="w-4 h-4" /> Joueurs proposés <span className="opacity-70">({counts.offre})</span>
          </button>
          <button onClick={() => setTab("recherche")}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium transition-colors ${tab === "recherche" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
            <SearchIcon className="w-4 h-4" /> Profils recherchés <span className="opacity-70">({counts.recherche})</span>
          </button>
          <div className="relative flex-1 min-w-[180px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Filtrer (poste, nom, club…)" className="pl-9 h-10" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-slate-400">
            <Store className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            {opps.length === 0 ? "Aucune annonce. Publiez la première opportunité." : "Aucune annonce dans cette catégorie."}
          </CardContent></Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(o => (
              <OppCard key={o.id} o={o} onEdit={(x) => { setEditing(x); setShowForm(true); }} onDelete={(id) => { if (confirm("Supprimer cette annonce ?")) deleteMut.mutate(id); }} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <OppForm open={showForm} onClose={() => { setShowForm(false); setEditing(null); setFormError(null); }}
          onSave={(data) => editing?.id ? updateMut.mutate({ id: editing.id, data: withOrg(data) }) : createMut.mutate(withOrg(data))}
          initial={editing} players={players} saving={saving} error={formError} />
      )}
    </div>
  );
}
