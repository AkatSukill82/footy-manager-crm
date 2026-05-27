import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ClipboardList, Plus, Search, Trash2, Eye,
  Star, Calendar, MapPin, Trophy, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ── Constantes ────────────────────────────────────────────────────────────────

const RECOMMANDATION_STYLES = {
  "Signer immédiatement": "bg-green-100 text-green-800 border-green-200",
  "À suivre 6 mois":      "bg-blue-100 text-blue-800 border-blue-200",
  "Intéressant":           "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Pas convaincu":         "bg-orange-100 text-orange-800 border-orange-200",
  "Non":                   "bg-red-100 text-red-800 border-red-200",
};

const CRITERES = [
  { key: "note_technique", label: "Technique" },
  { key: "note_vitesse",   label: "Vitesse" },
  { key: "note_physique",  label: "Physique" },
  { key: "note_mental",    label: "Mental" },
  { key: "note_tactique",  label: "Tactique" },
  { key: "note_vision",    label: "Vision jeu" },
  { key: "note_dribbles",  label: "Dribbles" },
  { key: "note_defense",   label: "Défense" },
];

const EMPTY_FORM = {
  player_id: "", player_nom: "", player_club: "", player_poste: "", player_photo: "",
  date_match: new Date().toISOString().split("T")[0],
  adversaire: "", competition: "", lieu: "Extérieur", score: "",
  note_technique: 5, note_vitesse: 5, note_physique: 5, note_mental: 5,
  note_tactique: 5, note_vision: 5, note_dribbles: 5, note_defense: 5,
  note_globale: 5,
  recommandation: "Intéressant",
  points_forts: "", points_faibles: "", notes_libres: "",
};

// ── Composant note (boutons 1-10) ─────────────────────────────────────────────
function RatingPicker({ value, onChange, label }) {
  return (
    <div>
      <Label className="text-xs text-slate-500 mb-1.5 block">{label}</Label>
      <div className="flex gap-1 flex-wrap">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
              value === n
                ? n >= 8 ? "bg-green-500 text-white"
                  : n >= 5 ? "bg-blue-500 text-white"
                  : "bg-red-400 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Formulaire ────────────────────────────────────────────────────────────────
function ReportForm({ initial, players, onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setN = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const autoNote = useMemo(() => {
    const vals = CRITERES.map(c => form[c.key]).filter(v => v > 0);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 5;
  }, [form]);

  const handlePlayerSelect = (pid) => {
    const p = players.find(pl => pl.id === pid);
    if (p) setForm(f => ({
      ...f,
      player_id: p.id,
      player_nom: p.nom,
      player_club: p.club_actuel || "",
      player_poste: p.poste || "",
      player_photo: p.photo_url || "",
    }));
    else setForm(f => ({ ...f, player_id: "", player_nom: "" }));
  };

  return (
    <div className="space-y-5 py-2">
      {/* Joueur */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs text-slate-500 mb-1 block">Joueur (depuis la base ou manuel)</Label>
          <Select value={form.player_id} onValueChange={handlePlayerSelect}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un joueur…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">— Saisie manuelle —</SelectItem>
              {players.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nom} · {p.club_actuel || "—"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Nom du joueur *</Label>
          <Input value={form.player_nom} onChange={set("player_nom")} placeholder="Kylian Mbappé" />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Club du joueur</Label>
          <Input value={form.player_club} onChange={set("player_club")} placeholder="Real Madrid" />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Poste</Label>
          <Input value={form.player_poste} onChange={set("player_poste")} placeholder="Attaquant" />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Date du match *</Label>
          <Input type="date" value={form.date_match} onChange={set("date_match")} />
        </div>
      </div>

      {/* Match */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Adversaire</Label>
          <Input value={form.adversaire} onChange={set("adversaire")} placeholder="FC Barcelone" />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Compétition</Label>
          <Input value={form.competition} onChange={set("competition")} placeholder="Champions League" />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Lieu</Label>
          <Select value={form.lieu} onValueChange={v => setForm(f => ({ ...f, lieu: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Domicile">Domicile</SelectItem>
              <SelectItem value="Extérieur">Extérieur</SelectItem>
              <SelectItem value="Neutre">Neutre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Score</Label>
          <Input value={form.score} onChange={set("score")} placeholder="2 - 1" />
        </div>
      </div>

      {/* Notes critères */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Notes par critère (1-10)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CRITERES.map(c => (
            <RatingPicker key={c.key} label={c.label} value={form[c.key]} onChange={setN(c.key)} />
          ))}
        </div>
      </div>

      {/* Note globale */}
      <div className="flex items-center gap-4 bg-slate-900 rounded-xl p-4">
        <div className="flex-1">
          <RatingPicker label="Note globale *" value={form.note_globale} onChange={setN("note_globale")} />
          <p className="text-xs text-slate-400 mt-1">Moyenne auto : {autoNote}/10</p>
        </div>
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, note_globale: autoNote }))}
          className="text-xs text-green-400 underline whitespace-nowrap"
        >
          Utiliser la moyenne
        </button>
      </div>

      {/* Recommandation */}
      <div>
        <Label className="text-xs text-slate-500 mb-1 block">Recommandation *</Label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(RECOMMANDATION_STYLES).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setForm(f => ({ ...f, recommandation: r }))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                form.recommandation === r
                  ? RECOMMANDATION_STYLES[r] + " ring-2 ring-offset-1 ring-current"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Textes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Points forts</Label>
          <Textarea rows={3} value={form.points_forts} onChange={set("points_forts")} placeholder="Vitesse, première touche…" />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Points faibles</Label>
          <Textarea rows={3} value={form.points_faibles} onChange={set("points_faibles")} placeholder="Jeu de tête, repli…" />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <Label className="text-xs text-slate-500 mb-1 block">Notes libres</Label>
          <Textarea rows={3} value={form.notes_libres} onChange={set("notes_libres")} placeholder="Observations générales…" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
        <Button
          onClick={() => onSave(form)}
          disabled={!form.player_nom.trim() || !form.date_match}
          className="flex-1 bg-slate-900 hover:bg-slate-800"
        >
          {initial?.id ? "Enregistrer" : "Créer le rapport"}
        </Button>
      </div>
    </div>
  );
}

// ── Carte rapport ─────────────────────────────────────────────────────────────
function ReportCard({ report, onView, onDelete }) {
  const noteColor = report.note_globale >= 8 ? "text-green-600" : report.note_globale >= 6 ? "text-blue-600" : "text-red-500";
  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group" onClick={() => onView(report)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {report.player_photo
            ? <img src={report.player_photo} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />
            : <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-6 h-6 text-slate-400" />
              </div>
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{report.player_nom}</p>
                <p className="text-xs text-slate-500 truncate">{report.player_poste} · {report.player_club || "—"}</p>
              </div>
              <div className={`text-2xl font-black flex-shrink-0 ${noteColor}`}>
                {report.note_globale}<span className="text-xs text-slate-400">/10</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className={`text-[10px] border ${RECOMMANDATION_STYLES[report.recommandation] || "bg-slate-100 text-slate-600"}`}>
                {report.recommandation}
              </Badge>
              {report.date_match && (
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(report.date_match), "d MMM yyyy", { locale: fr })}
                </span>
              )}
              {report.competition && (
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                  <Trophy className="w-3 h-3" />{report.competition}
                </span>
              )}
            </div>
            {report.adversaire && (
              <p className="text-[11px] text-slate-400 mt-1">
                vs {report.adversaire} {report.score ? `(${report.score})` : ""} · {report.lieu}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex gap-3">
            {CRITERES.slice(0, 4).map(c => (
              report[c.key] ? (
                <div key={c.key} className="text-center">
                  <div className="text-xs font-bold text-slate-700">{report[c.key]}</div>
                  <div className="text-[9px] text-slate-400 leading-none">{c.label}</div>
                </div>
              ) : null
            ))}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); onDelete(report.id); }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <ChevronRight className="w-4 h-4 text-slate-300 self-center" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function ScoutingReportsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterReco, setFilterReco] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewReport, setViewReport] = useState(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["scouting-reports"],
    queryFn: () => base44.entities.ScoutingReport.list("-date_match", 200),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ScoutingReport.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["scouting-reports"] }); setModalOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScoutingReport.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scouting-reports"] }),
  });

  const filtered = useMemo(() => reports.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.player_nom?.toLowerCase().includes(q) || r.competition?.toLowerCase().includes(q) || r.adversaire?.toLowerCase().includes(q);
    const matchReco = filterReco === "all" || r.recommandation === filterReco;
    return matchSearch && matchReco;
  }), [reports, search, filterReco]);

  const stats = useMemo(() => ({
    total: reports.length,
    signer: reports.filter(r => r.recommandation === "Signer immédiatement").length,
    suivre: reports.filter(r => r.recommandation === "À suivre 6 mois").length,
    moyNote: reports.length ? (reports.reduce((a, r) => a + (r.note_globale || 0), 0) / reports.length).toFixed(1) : "—",
  }), [reports]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            Rapports de scouting
          </h1>
          <p className="text-slate-500 text-sm mt-1">Évaluations de joueurs observés sur le terrain</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" /> Nouveau rapport
        </Button>
      </div>

      {/* Stats */}
      {reports.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Rapports", value: stats.total, color: "text-violet-600 bg-violet-50" },
            { label: "À signer", value: stats.signer, color: "text-green-600 bg-green-50" },
            { label: "À suivre", value: stats.suivre, color: "text-blue-600 bg-blue-50" },
            { label: "Note moy.", value: `${stats.moyNote}/10`, color: "text-orange-600 bg-orange-50" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3 shadow-sm">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Star className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-lg text-slate-900 leading-none">{value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Rechercher joueur, compétition…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterReco} onValueChange={setFilterReco}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Recommandation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes recommandations</SelectItem>
            {Object.keys(RECOMMANDATION_STYLES).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="grid gap-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <ClipboardList className="w-12 h-12 text-violet-300 mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Aucun rapport trouvé</p>
          <p className="text-slate-400 text-sm mt-1 mb-5">Créez votre premier rapport de scouting après avoir observé un joueur</p>
          <Button onClick={() => setModalOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Nouveau rapport
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(r => (
            <ReportCard
              key={r.id}
              report={r}
              onView={setViewReport}
              onDelete={id => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Modal création */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-violet-600" />
              Nouveau rapport de scouting
            </DialogTitle>
          </DialogHeader>
          <ReportForm
            players={players}
            onSave={data => createMutation.mutate(data)}
            onClose={() => setModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal détail */}
      <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          {viewReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{viewReport.player_nom}</span>
                  <Badge className={`border ${RECOMMANDATION_STYLES[viewReport.recommandation]}`}>
                    {viewReport.recommandation}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between bg-slate-900 rounded-xl p-4">
                  <div>
                    <p className="text-slate-400 text-xs">Note globale</p>
                    <p className="text-4xl font-black text-white">{viewReport.note_globale}<span className="text-lg text-slate-400">/10</span></p>
                  </div>
                  <div className="text-right text-sm text-slate-300">
                    <p>{viewReport.player_club} · {viewReport.player_poste}</p>
                    <p className="text-slate-400">{viewReport.date_match && format(new Date(viewReport.date_match), "d MMMM yyyy", { locale: fr })}</p>
                    {viewReport.adversaire && <p>vs {viewReport.adversaire} ({viewReport.lieu})</p>}
                    {viewReport.competition && <p className="text-slate-500">{viewReport.competition}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {CRITERES.map(c => viewReport[c.key] ? (
                    <div key={c.key} className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                      <div className={`text-xl font-black ${viewReport[c.key] >= 8 ? "text-green-600" : viewReport[c.key] >= 5 ? "text-blue-600" : "text-red-500"}`}>
                        {viewReport[c.key]}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{c.label}</div>
                    </div>
                  ) : null)}
                </div>
                {viewReport.points_forts && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-green-700 mb-1">Points forts</p>
                    <p className="text-sm text-green-800 whitespace-pre-line">{viewReport.points_forts}</p>
                  </div>
                )}
                {viewReport.points_faibles && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-red-700 mb-1">Points faibles</p>
                    <p className="text-sm text-red-800 whitespace-pre-line">{viewReport.points_faibles}</p>
                  </div>
                )}
                {viewReport.notes_libres && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Notes libres</p>
                    <p className="text-sm text-slate-700 whitespace-pre-line">{viewReport.notes_libres}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
