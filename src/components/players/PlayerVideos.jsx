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
import { Video, Plus, Play, Trash2, ExternalLink, Loader2, Film, AlertCircle, Upload, Check } from "lucide-react";
import { useCurrentUser } from "../../lib/useCurrentUser";
import { useLanguage } from "../../lib/LanguageContext";

const TYPE_KEYS = ["highlights", "buts", "match_complet", "interview", "entrainement", "autre"];
const PV = {
  fr: { videos: "Vidéos", add: "Ajouter", empty: "Aucune vidéo. Ajoutez des highlights (YouTube, Veo, Vimeo…).", openVideo: "Ouvrir la vidéo", noTitle: "Sans titre", addVideo: "Ajouter une vidéo", linkLabel: "Lien vidéo (YouTube…) ou fichier du PC *", linkPh: "https://youtube.com/watch?v=… ou importez un fichier", uploading: "Envoi…", importPc: "Importer une vidéo du PC", fileReady: "fichier prêt", titre: "Titre", titrePh: "Ex: Highlights saison 2025", type: "Type", date: "Date", cancel: "Annuler", cantAdd: "Impossible d'ajouter la vidéo.", cantDelete: "Suppression impossible.", unknownErr: "erreur inconnue", emptyResp: "réponse vide du serveur", uploadErr: (mb, msg) => `Échec de l'envoi de la vidéo (${mb} Mo) : ${msg}. Les vidéos lourdes passent mal — réduis la taille/durée, ou colle un lien YouTube/Veo.`, cats: { highlights: "Highlights", buts: "Buts", match_complet: "Match complet", interview: "Interview", entrainement: "Entraînement", autre: "Autre" } },
  en: { videos: "Videos", add: "Add", empty: "No video. Add highlights (YouTube, Veo, Vimeo…).", openVideo: "Open video", noTitle: "Untitled", addVideo: "Add a video", linkLabel: "Video link (YouTube…) or PC file *", linkPh: "https://youtube.com/watch?v=… or import a file", uploading: "Uploading…", importPc: "Import a video from PC", fileReady: "file ready", titre: "Title", titrePh: "e.g. 2025 season highlights", type: "Type", date: "Date", cancel: "Cancel", cantAdd: "Couldn't add the video.", cantDelete: "Couldn't delete.", unknownErr: "unknown error", emptyResp: "empty server response", uploadErr: (mb, msg) => `Video upload failed (${mb} MB): ${msg}. Heavy videos don't upload well — reduce size/length, or paste a YouTube/Veo link.`, cats: { highlights: "Highlights", buts: "Goals", match_complet: "Full match", interview: "Interview", entrainement: "Training", autre: "Other" } },
  es: { videos: "Vídeos", add: "Añadir", empty: "Sin vídeos. Añade highlights (YouTube, Veo, Vimeo…).", openVideo: "Abrir el vídeo", noTitle: "Sin título", addVideo: "Añadir un vídeo", linkLabel: "Enlace de vídeo (YouTube…) o archivo del PC *", linkPh: "https://youtube.com/watch?v=… o importa un archivo", uploading: "Enviando…", importPc: "Importar un vídeo del PC", fileReady: "archivo listo", titre: "Título", titrePh: "Ej: Highlights temporada 2025", type: "Tipo", date: "Fecha", cancel: "Cancelar", cantAdd: "No se pudo añadir el vídeo.", cantDelete: "No se pudo eliminar.", unknownErr: "error desconocido", emptyResp: "respuesta vacía del servidor", uploadErr: (mb, msg) => `Error al subir el vídeo (${mb} MB): ${msg}. Los vídeos pesados no se suben bien — reduce el tamaño/duración, o pega un enlace de YouTube/Veo.`, cats: { highlights: "Highlights", buts: "Goles", match_complet: "Partido completo", interview: "Entrevista", entrainement: "Entrenamiento", autre: "Otro" } },
};

// Extrait l'ID YouTube de la plupart des formats d'URL
function youtubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

// Détecte un fichier vidéo direct (ex: uploadé depuis le PC) lisible par <video>.
function isVideoFile(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg|ogv|mov|m4v|m3u8)(\?|#|$)/i.test(url);
}

function VideoCard({ v, onDelete, T }) {
  const [playing, setPlaying] = useState(false);
  const ytId = youtubeId(v.url);
  const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
  // Embed robuste : domaine sans cookie, lecture in-app (playsinline) et origin
  // explicite — limite les erreurs de contexte (iframe Base44 / WebView).
  const origin = typeof window !== "undefined" ? `&origin=${encodeURIComponent(window.location.origin)}` : "";
  const embedSrc = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&playsinline=1&rel=0&modestbranding=1${origin}`;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white group">
      <div className="relative aspect-video bg-slate-900">
        {playing && ytId ? (
          <>
            <iframe
              className="w-full h-full"
              src={embedSrc}
              title={v.titre || "vidéo"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            {/* Échappatoire si la vidéo refuse l'intégration (erreur 150/153) */}
            <a href={v.url} target="_blank" rel="noopener noreferrer"
              className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white/90 px-1.5 py-0.5 rounded hover:bg-red-600">
              YouTube ↗
            </a>
          </>
        ) : thumb ? (
          <button onClick={() => setPlaying(true)} className="w-full h-full relative">
            <img src={thumb} alt={v.titre} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              </div>
            </div>
          </button>
        ) : isVideoFile(v.url) ? (
          // Fichier vidéo uploadé depuis le PC : lecteur natif.
          <video src={v.url} controls playsInline preload="metadata" className="w-full h-full bg-black object-contain" />
        ) : (
          <a href={v.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex flex-col items-center justify-center text-slate-400 hover:text-white transition-colors">
            <Film className="w-8 h-8 mb-1" />
            <span className="text-xs">{T.openVideo}</span>
          </a>
        )}
      </div>
      <div className="p-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{v.titre || T.noTitle}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-[10px]">{T.cats[v.type] || v.type}</Badge>
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
  const { lang } = useLanguage();
  const T = PV[lang] || PV.fr;
  const currentUser = useCurrentUser();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = React.useRef(null);
  const [f, setF] = useState({ titre: "", url: "", type: "highlights", date_video: "" });

  // Upload d'un fichier vidéo depuis le PC → devient le lien de la vidéo.
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    const mb = Math.round(file.size / (1024 * 1024));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error(T.emptyResp);
      setF(s => ({ ...s, url: file_url, titre: s.titre?.trim() ? s.titre : file.name }));
    } catch (err) {
      // On affiche la vraie raison (souvent : fichier trop lourd).
      const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.message || T.unknownErr;
      setError(T.uploadErr(mb, msg));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["player-videos", player.id],
    queryFn: () => base44.entities.PlayerVideo.filter({ player_id: player.id }, "-date_video"),
    enabled: !!player.id,
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.PlayerVideo.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["player-videos", player.id] }); setShowForm(false); setF({ titre: "", url: "", type: "highlights", date_video: "" }); },
    onError: (err) => setError(err?.message || T.cantAdd),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.PlayerVideo.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["player-videos", player.id] }),
    onError: (err) => setError(err?.message || T.cantDelete),
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
          <CardTitle className="text-sm flex items-center gap-2"><Video className="w-4 h-4 text-red-500" /> {T.videos}</CardTitle>
          <Button size="sm" variant="outline" onClick={() => { setError(null); setShowForm(true); }} className="h-7 text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> {T.add}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && !showForm && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs mb-3">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-red-400 animate-spin" /></div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            <Film className="w-7 h-7 mx-auto mb-1.5 text-slate-300" />
            {T.empty}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {videos.map(v => <VideoCard key={v.id} v={v} onDelete={deleteMut.mutate} T={T} />)}
          </div>
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{T.addVideo}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{error}</span>
              </div>
            )}
            <div>
              <Label className="text-xs">{T.linkLabel}</Label>
              <Input value={f.url} onChange={set("url")} placeholder={T.linkPh} />
              <div className="flex items-center gap-2 mt-2">
                <input ref={fileRef} type="file" accept="video/*" onChange={handleFile} className="hidden" />
                <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-8 text-xs gap-1.5">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? T.uploading : T.importPc}
                </Button>
                {isVideoFile(f.url) && !uploading && <span className="text-[11px] text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {T.fileReady}</span>}
              </div>
            </div>
            <div><Label className="text-xs">{T.titre}</Label><Input value={f.titre} onChange={set("titre")} placeholder={T.titrePh} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{T.type}</Label>
                <Select value={f.type} onValueChange={set("type")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPE_KEYS.map(v => <SelectItem key={v} value={v}>{T.cats[v]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">{T.date}</Label><Input type="date" value={f.date_video} onChange={set("date_video")} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>{T.cancel}</Button>
            <Button onClick={submit} disabled={createMut.isPending || !f.url.trim()} className="bg-slate-900 hover:bg-slate-700">
              {createMut.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{T.add}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
