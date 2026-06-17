import React, { useState, useEffect } from "react";
import { invokeFn } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Check, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";

/**
 * Modal de sélection d'image via Google Custom Search.
 *
 * Props :
 *   open        {boolean}
 *   onClose     {() => void}
 *   onSelect    {(url: string) => void}  — appelé avec l'URL choisie
 *   initialQuery {string}               — pré-rempli avec le nom du joueur/club
 *   type        {"player"|"club"}
 */
export default function ImageSearchPicker({ open, onClose, onSelect, initialQuery = "", type = "player" }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [brokenImages, setBrokenImages] = useState(new Set());

  // Auto-search quand le modal s'ouvre
  useEffect(() => {
    if (open && initialQuery) {
      setQuery(initialQuery);
      search(initialQuery);
    }
    if (!open) {
      setResults([]);
      setSelected(null);
      setError(null);
      setBrokenImages(new Set());
    }
  }, [open, initialQuery]);

  const search = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setSelected(null);
    setBrokenImages(new Set());
    try {
      const data = await invokeFn("searchGoogleImages", { query: q.trim(), type });
      if (data?.error) {
        setError(data.error);
      } else {
        setResults(data?.items ?? []);
        if ((data?.items ?? []).length === 0) {
          setError("Aucun résultat trouvé. Essayez d'affiner la recherche.");
        }
      }
    } catch (e) {
      setError(e.message || "Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  const validResults = results.filter(r => !brokenImages.has(r.url));

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <DialogTitle className="text-base font-semibold text-slate-900">
            Rechercher une image
          </DialogTitle>
          <p className="text-xs text-slate-400 mt-0.5">
            Résultats via Google Images · {type === "player" ? "Joueur" : "Club"}
          </p>
        </DialogHeader>

        {/* Search bar */}
        <div className="px-5 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search()}
                placeholder={type === "player" ? "Nom du joueur + club…" : "Nom du club…"}
                className="pl-9 text-sm"
                autoFocus
              />
            </div>
            <Button
              onClick={() => search()}
              disabled={loading || !query.trim()}
              className="bg-slate-900 hover:bg-slate-800 flex-shrink-0"
              size="sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Results grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-3" />
              <p className="text-sm">Recherche en cours…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700 font-medium">Erreur</p>
                <p className="text-xs text-red-500 mt-0.5">{error}</p>
                {error.includes("non configurée") && (
                  <p className="text-xs text-red-400 mt-2">
                    → Ajoutez <code className="bg-red-100 px-1 rounded">GOOGLE_IMAGES_API_KEY</code> et <code className="bg-red-100 px-1 rounded">GOOGLE_IMAGES_CX</code> dans les variables d'environnement de la fonction.
                  </p>
                )}
              </div>
            </div>
          )}

          {!loading && validResults.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {validResults.map((item, i) => {
                const isSelected = selected === item.url;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : item.url)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-square group ${
                      isSelected
                        ? "border-slate-900 shadow-lg ring-2 ring-slate-900 ring-offset-1"
                        : "border-transparent hover:border-slate-300"
                    }`}
                    title={item.title}
                  >
                    <img
                      src={item.thumbnail || item.url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={() => setBrokenImages(prev => new Set([...prev, item.url]))}
                    />
                    {/* Source badge */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] text-white truncate">{item.source}</p>
                    </div>
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center shadow">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <Search className="w-8 h-8 mb-3" />
              <p className="text-sm">Lancez une recherche pour voir les résultats</p>
            </div>
          )}
        </div>

        {/* Selected preview + confirm */}
        <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0 flex items-center gap-3">
          {selected ? (
            <>
              <img
                src={selected}
                alt="Sélection"
                className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-0.5">Image sélectionnée</p>
                <p className="text-[11px] text-slate-600 truncate">{selected}</p>
              </div>
              <a
                href={selected}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-slate-600 flex-shrink-0"
                title="Voir l'image originale"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </>
          ) : (
            <p className="text-sm text-slate-400 flex-1">
              {validResults.length > 0 ? "Cliquez sur une image pour la sélectionner" : "Aucune image sélectionnée"}
            </p>
          )}
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={onClose} className="border-slate-200">
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!selected}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40"
            >
              Utiliser cette image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
