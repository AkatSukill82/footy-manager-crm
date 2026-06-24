import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { withOrg } from "../lib/org";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, User, Loader2, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

// ── Colonnes du pipeline ──────────────────────────────────────────────────────

const COLUMNS = [
  { key: "Identifié",    label: "Identifié",    color: "border-t-slate-400",   bg: "bg-slate-50",   badge: "bg-slate-100 text-slate-700",    dot: "bg-slate-400" },
  { key: "Étudié",      label: "Étudié",        color: "border-t-blue-400",    bg: "bg-blue-50/40", badge: "bg-blue-100 text-blue-700",       dot: "bg-blue-400" },
  { key: "Contacté",    label: "Contacté",      color: "border-t-violet-400",  bg: "bg-violet-50/40", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-400" },
  { key: "Négociation", label: "Négociation",   color: "border-t-orange-400",  bg: "bg-orange-50/40", badge: "bg-orange-100 text-orange-700", dot: "bg-orange-400" },
  { key: "Signé",       label: "Signé ✓",       color: "border-t-green-500",   bg: "bg-green-50/40", badge: "bg-green-100 text-green-700",   dot: "bg-green-500" },
  { key: "Refusé",      label: "Refusé",        color: "border-t-red-400",     bg: "bg-red-50/40",  badge: "bg-red-100 text-red-700",         dot: "bg-red-400" },
];

const PRIORITE_STYLES = {
  "Haute":   "bg-red-100 text-red-700 border-red-200",
  "Moyenne": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Basse":   "bg-slate-100 text-slate-600 border-slate-200",
};

const EMPTY = {
  player_id: "", player_nom: "", player_photo: "", poste: "", club_actuel: "",
  nationalite: "", age: "", valeur_marchande: "", budget_max: "", agent: "",
  etape: "Identifié", priorite: "Moyenne", notes: "",
  date_ajout: new Date().toISOString().split("T")[0],
};

// ── Carte joueur dans le Kanban ───────────────────────────────────────────────
function PipelineCard({ card, onDelete, onEdit, onDragStart }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (card.player_id) {
      navigate(`/player-detail?id=${card.player_id}`);
    } else {
      onEdit(card);
    }
  };

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, card.id)}
      onClick={handleCardClick}
      className="bg-white rounded-xl border border-slate-200 p-3 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all group select-none"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {card.priorite && card.priorite !== "Moyenne" && (
              <Badge className={`text-[9px] border px-1.5 py-0 ${PRIORITE_STYLES[card.priorite]}`}>{card.priorite}</Badge>
            )}
            {card.poste && <span className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{card.poste}</span>}
          </div>

          <div className="flex items-center gap-2">
            {card.player_photo
              ? <img src={card.player_photo} alt={card.player_nom || ""} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" referrerPolicy="no-referrer" />
              : <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
            }
            <div className="min-w-0">
              <p className="font-semibold text-sm text-slate-900 truncate leading-tight">{card.player_nom}</p>
              <p className="text-[11px] text-slate-500 truncate leading-tight">{card.club_actuel || "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {card.valeur_marchande != null && (
              <span className="text-[11px] text-emerald-700 font-semibold">{card.valeur_marchande}M€</span>
            )}
            {card.age && (
              <span className="text-[11px] text-slate-400">{card.age} ans</span>
            )}
            {card.nationalite && (
              <span className="text-[11px] text-slate-400">{card.nationalite}</span>
            )}
          </div>
          {card.notes && (
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-snug">{card.notes}</p>
          )}
        </div>
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onEdit(card); }}
            className="text-slate-300 hover:text-slate-600 p-0.5"
            title="Modifier"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(card.id); }}
            className="text-slate-300 hover:text-red-400 p-0.5"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Formulaire ajout/édition ──────────────────────────────────────────────────
function CardForm({ initial, players, onSave, onClose, isSaving }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handlePlayerSelect = pid => {
    const p = players.find(pl => pl.id === pid);
    if (p) setForm(f => ({
      ...f, player_id: p.id, player_nom: p.nom,
      player_photo: p.photo_url || "", poste: p.poste || "",
      club_actuel: p.club_actuel || "", nationalite: p.nationalite || "",
      age: p.age || "", valeur_marchande: p.valeur_marchande || "",
    }));
  };

  return (
    <div className="space-y-4 py-2">
      <div>
        <Label className="text-xs text-slate-500 mb-1 block">Depuis la base joueurs</Label>
        <Select value={form.player_id} onValueChange={handlePlayerSelect}>
          <SelectTrigger><SelectValue placeholder="Lier à un joueur existant…" /></SelectTrigger>
          <SelectContent>
            {players.map(p => <SelectItem key={p.id} value={p.id}>{p.nom} · {p.club_actuel || "—"}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs text-slate-500 mb-1 block">Nom du joueur *</Label>
          <Input value={form.player_nom} onChange={set("player_nom")} placeholder="Nom complet" />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Poste</Label>
          <Input value={form.poste} onChange={set("poste")} placeholder="Attaquant" />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Club actuel</Label>
          <Input value={form.club_actuel} onChange={set("club_actuel")} placeholder="PSG" />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Âge</Label>
          <Input type="number" value={form.age} onChange={set("age")} placeholder="24" />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Valeur marchande (M€)</Label>
          <Input type="number" value={form.valeur_marchande} onChange={set("valeur_marchande")} placeholder="25" />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Budget max alloué (M€)</Label>
          <Input type="number" value={form.budget_max} onChange={set("budget_max")} placeholder="30" />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Agent</Label>
          <Input value={form.agent} onChange={set("agent")} placeholder="Nom de l'agent" />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Étape</Label>
          <Select value={form.etape} onValueChange={v => setForm(f => ({ ...f, etape: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COLUMNS.map(c => <SelectItem key={c.key} value={c.key}>{c.key}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Priorité</Label>
          <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Haute">Haute</SelectItem>
              <SelectItem value="Moyenne">Moyenne</SelectItem>
              <SelectItem value="Basse">Basse</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-xs text-slate-500 mb-1 block">Notes</Label>
          <Textarea rows={2} value={form.notes} onChange={set("notes")} placeholder="Informations internes, contacts établis…" />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
        <Button
          onClick={() => onSave({ ...form, age: form.age ? +form.age : null, valeur_marchande: form.valeur_marchande ? +form.valeur_marchande : null, budget_max: form.budget_max ? +form.budget_max : null })}
          disabled={!form.player_nom.trim() || isSaving}
          className="flex-1 bg-slate-900 hover:bg-slate-800"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {initial?.id ? "Enregistrer" : "Ajouter au pipeline"}
        </Button>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function PipelinePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [defaultEtape, setDefaultEtape] = useState("Identifié");

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["pipeline"],
    queryFn: () => base44.entities.Pipeline.list("-created_date", 500),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.Pipeline.create(withOrg(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      setModalOpen(false);
      setEditCard(null);
      toast({ title: "Joueur ajouté au pipeline" });
    },
    onError: (err) => {
      toast({ title: "Erreur lors de l'ajout", description: err?.message || String(err), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => base44.entities.Pipeline.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      setModalOpen(false);
      setEditCard(null);
    },
    onError: (err) => {
      toast({ title: "Erreur lors de la modification", description: err?.message || String(err), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.Pipeline.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline"] }),
    onError: (err) => toast({ title: "Erreur lors de la suppression", description: err?.message || String(err), variant: "destructive" }),
  });

  const cardsByCol = useMemo(() => {
    const map = {};
    COLUMNS.forEach(c => { map[c.key] = []; });
    cards.forEach(card => {
      if (map[card.etape]) map[card.etape].push(card);
    });
    return map;
  }, [cards]);

  // Drag handlers
  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e, col) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(col);
  };
  const handleDrop = (e, etape) => {
    e.preventDefault();
    if (draggedId && cards.find(c => c.id === draggedId)?.etape !== etape) {
      updateMutation.mutate({ id: draggedId, etape });
    }
    setDraggedId(null);
    setDragOverCol(null);
  };
  const handleDragEnd = () => { setDraggedId(null); setDragOverCol(null); };

  const openNew = (etape = "Identifié") => { setDefaultEtape(etape); setEditCard(null); setModalOpen(true); };
  const openEdit = card => { setEditCard(card); setDefaultEtape(card.etape); setModalOpen(true); };

  const handleSave = data => {
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== null && v !== undefined)
    );
    if (editCard?.id) updateMutation.mutate({ ...clean, id: editCard.id });
    else createMutation.mutate(clean);
  };

  const totalVal = cards.reduce((a, c) => a + (c.valeur_marchande || 0), 0);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pipeline de recrutement</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {cards.length} joueurs suivis · Valeur totale : {totalVal.toFixed(1)} M€
          </p>
        </div>
        <Button onClick={() => openNew()} className="bg-slate-900 hover:bg-slate-800 text-white gap-2" size="sm">
          <Plus className="w-4 h-4" /> Ajouter un joueur
        </Button>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full min-w-max">
          {COLUMNS.map(col => {
            const colCards = cardsByCol[col.key] || [];
            const isOver = dragOverCol === col.key;
            return (
              <div
                key={col.key}
                className={`flex flex-col w-64 rounded-xl border-2 border-t-4 transition-colors ${col.color} ${
                  isOver ? "border-slate-300 bg-slate-100" : "border-slate-200 bg-white"
                }`}
                onDragOver={e => handleDragOver(e, col.key)}
                onDrop={e => handleDrop(e, col.key)}
                onDragLeave={() => setDragOverCol(null)}
              >
                {/* Entête colonne */}
                <div className={`px-3 py-2.5 flex items-center justify-between rounded-t-lg ${col.bg}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="font-semibold text-sm text-slate-800">{col.label}</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${col.badge}`}>{colCards.length}</span>
                  </div>
                  <button
                    onClick={() => openNew(col.key)}
                    className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded"
                    title={`Ajouter dans ${col.key}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
                  {colCards.map(card => (
                    <PipelineCard
                      key={card.id}
                      card={card}
                      onDelete={id => deleteMutation.mutate(id)}
                      onEdit={openEdit}
                      onDragStart={handleDragStart}
                    />
                  ))}
                  {colCards.length === 0 && !isOver && (
                    <div className="text-center py-6 text-xs text-slate-300 select-none">
                      Glissez un joueur ici
                    </div>
                  )}
                </div>

                {/* Footer valeur */}
                {colCards.some(c => c.valeur_marchande) && (
                  <div className="px-3 py-2 border-t border-slate-100 text-[11px] text-slate-400 text-right">
                    {colCards.reduce((a, c) => a + (c.valeur_marchande || 0), 0).toFixed(1)} M€
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={v => { if (!v) { setModalOpen(false); setEditCard(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editCard ? "Modifier" : "Ajouter au pipeline"}</DialogTitle>
          </DialogHeader>
          <CardForm
            key={editCard?.id ?? "new"}
            initial={editCard ? editCard : { ...EMPTY, etape: defaultEtape }}
            players={players}
            onSave={handleSave}
            onClose={() => { setModalOpen(false); setEditCard(null); }}
            isSaving={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
