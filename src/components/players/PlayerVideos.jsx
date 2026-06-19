import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Plus, Play, Trash2, ExternalLink, Loader2, Film, AlertCircle } from "lucide-react";
import { useCurrentUser } from "../../lib/useCurrentUser";

const TYPES = [
  { v: "highlights",    label: "Highlights" },
  { v: "buts",          label: "Buts" },
  { v: "match_complet", label: "Match complet" },
  { v: "interview",     label: "Interview" },
  { v: "entrainement",  label: "Entraînement" },
  { v: "autre",         label: "Autre" },
];
const typeLabel = (v) => TYPES.find(t => t.v === v)?.label || v;

// Extrait l'ID YouTube de la plupart des formats d'URL
function youtubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function VideoCard({ v, onDelete }) {
  const [playing, setPlaying] = useState(false);
  const ytId = youtubeId(v.url);
  const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white group">
      <div className="relative aspect-video bg-slate-900">
        {playing && ytId ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
            title={v.titre || "vidéo"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : thumb ? (
          <button onClick={() => setPlaying(true)} className="w-full h-full relative">
            <img src={thumb} alt={v.titre} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              </div>
            </div>
          </button>
        ) : (
          <a href={v.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex flex-col items-center justify-center text-slate-400 hover:text-white transition-colors">
            <Film className="w-8 h-8 mb-1" />
            <span className="text-xs">Ouvrir la vidéo</span>
          </a>
        )}
      </div>
      <div className="p-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{v.titre || "Sans titre"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-[10px]">{typeLabel(v.type)}</Badge>
            {v.date_video && <span className="text-[10px] text-slate-400">{v.date_video}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <a href={v.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><ExternalLink className="w-3.5 h-3.5" /></a>
          <button onClick={() => onDelete(v.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

export default function PlayerVideos({ player }) {
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [f, setF] = useState({ titre: "", url: "", type: "highlights", date_video: "" });

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["player-videos", player.id],
    queryFn: () => base44.entities.PlayerVideo.filter({ player_id: player.id }, "-date_video"),
    enabled: !!player.id,
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.PlayerVideo.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["player-videos", player.id] }); setShowForm(false); setF({ titre: "", url: "", type: "highlights", date_video: "" }); },
    onError: (err) => setError(err?.message || "Impossible d'ajouter la vidéo."),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.PlayerVideo.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["player-videos", player.id] }),
  });

  const set = (k) => (e) => setF(s => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const submit = () => {
    if (!f.url.trim()) return;
    setError(null);
    // organization_id requis par la RLS de création (non auto-injecté par Base44).
    const clean = { player_id: player.id, organization_id: currentUser?.organization_id ?? null, ...f };
    Object.keys(clean).forEach(k => { if (clean[k] === "") clean[k] = null; });
    createMut.mutate(clean);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Video className="w-4 h-4 text-red-500" /> Vidéos</CardTitle>
          <Button size="sm" variant="outline" onClick={() => { setError(null); setShowForm(true); }} className="h-7 text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-red-400 animate-spin" /></div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            <Film className="w-7 h-7 mx-auto mb-1.5 text-slate-300" />
            Aucune vidéo. Ajoutez des highlights (YouTube, Veo, Vimeo…).
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {videos.map(v => <VideoCard key={v.id} v={v} onDelete={deleteMut.mutate} />)}
          </div>
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ajouter une vidéo</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{error}</span>
              </div>
            )}
            <div><Label className="text-xs">Lien vidéo *</Label><Input value={f.url} onChange={set("url")} placeholder="https://youtube.com/watch?v=…" /></div>
            <div><Label className="text-xs">Titre</Label><Input value={f.titre} onChange={set("titre")} placeholder="Ex: Highlights saison 2025" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={f.type} onValueChange={set("type")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Date</Label><Input type="date" value={f.date_video} onChange={set("date_video")} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={submit} disabled={createMut.isPending || !f.url.trim()} className="bg-slate-900 hover:bg-slate-700">
              {createMut.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
