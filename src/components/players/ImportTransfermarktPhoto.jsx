import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image, Loader2, CheckCircle2, Search, Link2, AlertCircle } from "lucide-react";
import ImageSearchPicker from "../ui/ImageSearchPicker";

export default function ImportTransfermarktPhoto({ player, onApply }) {
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState(null);
  const [previewOk, setPreviewOk] = useState(true);

  const applyUrl = async (url) => {
    setApplying(true);
    setError(null);
    try {
      await base44.entities.Player.update(player.id, { photo_url: url });
      onApply?.({ ...player, photo_url: url });
      // Rafraîchit la fiche + la liste immédiatement (pas besoin de recréer).
      queryClient.invalidateQueries({ queryKey: ['player', player.id] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setApplied(true);
      setTimeout(() => setApplied(false), 3000);
    } catch (e) {
      setError(e.message || "Erreur lors de l'enregistrement");
    } finally {
      setApplying(false);
    }
  };

  const searchQuery = player.nom + (player.club_actuel ? ` ${player.club_actuel}` : "");

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Image className="w-4 h-4 text-slate-400" />
        <span className="font-semibold text-sm text-slate-800">Photo du joueur</span>
        {applied && (
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Enregistré
          </span>
        )}
      </div>

      {/* Photo actuelle */}
      {player.photo_url && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <img
            src={player.photo_url}
            alt={player.nom}
            className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0"
            onError={e => { e.target.style.display = "none"; }}
          />
          <p className="text-[11px] text-slate-400 break-all min-w-0 line-clamp-2">{player.photo_url}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* CTA principal */}
      <Button
        onClick={() => setPickerOpen(true)}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2"
        size="sm"
        disabled={applying}
      >
        {applying
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Search className="w-4 h-4" />
        }
        Rechercher sur Google Images
      </Button>

      {/* URL manuelle en fallback */}
      <button
        type="button"
        onClick={() => setManualMode(v => !v)}
        className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
      >
        <Link2 className="w-3 h-3" />
        {manualMode ? "Fermer" : "Coller une URL directement"}
      </button>

      {manualMode && (
        <div className="flex gap-2">
          <Input
            value={manualUrl}
            onChange={e => { setManualUrl(e.target.value); setPreviewOk(true); }}
            placeholder="https://..."
            className="text-xs flex-1"
          />
          {manualUrl && previewOk && (
            <img
              src={manualUrl}
              alt=""
              className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0"
              onError={() => setPreviewOk(false)}
            />
          )}
          <Button
            size="sm"
            onClick={() => applyUrl(manualUrl.trim())}
            disabled={!manualUrl.trim() || applying}
            className="bg-slate-900 hover:bg-slate-800 flex-shrink-0"
          >
            {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "OK"}
          </Button>
        </div>
      )}

      <ImageSearchPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={url => applyUrl(url)}
        initialQuery={searchQuery}
        type="player"
      />
    </div>
  );
}
