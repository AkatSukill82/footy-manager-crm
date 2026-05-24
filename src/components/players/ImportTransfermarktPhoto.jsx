import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image, Loader2, CheckCircle2, RefreshCw, ExternalLink, Link2, AlertCircle } from "lucide-react";

export default function ImportTransfermarktPhoto({ player, onApply }) {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState(null);
  const [selected, setSelected] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const handleSearch = async () => {
    setLoading(true);
    setCandidates(null);
    setSelected(null);
    setApplied(false);
    setImageErrors({});

    const data = await base44.integrations.Core.InvokeLLM({
      prompt: `Recherche la photo officielle du joueur de football "${player.nom}"${player.club_actuel ? ` qui joue à ${player.club_actuel}` : ""}${player.nationalite ? `, nationalité ${player.nationalite}` : ""}.

Donne-moi 3 URLs directes d'images de ce joueur, en priorité :
1. Wikipedia (https://upload.wikimedia.org/...)
2. Site officiel du club ou UEFA/FIFA
3. Une autre source fiable

IMPORTANT : 
- Les URLs doivent pointer directement vers un fichier image (.jpg, .png, .webp)
- NE PAS donner des URLs Transfermarkt car elles sont bloquées
- Préfère Wikipedia, les sites officiels des clubs, UEFA.com, FIFA.com
- Vérifie bien que les URLs existent et sont accessibles`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          photo_1: { type: "string", description: "URL directe image 1 (Wikipedia de préférence)" },
          source_1: { type: "string", description: "Nom de la source 1" },
          photo_2: { type: "string", description: "URL directe image 2" },
          source_2: { type: "string", description: "Nom de la source 2" },
          photo_3: { type: "string", description: "URL directe image 3" },
          source_3: { type: "string", description: "Nom de la source 3" },
          profil_transfermarkt: { type: "string", description: "URL du profil Transfermarkt (pour référence seulement)" },
        }
      }
    });

    setCandidates(data);
    setLoading(false);
  };

  const handleApply = async (photoUrl) => {
    setApplying(true);
    await onApply({ photo_url: photoUrl });
    setApplied(true);
    setApplying(false);
  };

  const handleManualApply = async () => {
    if (!manualUrl.trim()) return;
    await handleApply(manualUrl.trim());
  };

  const candidateList = candidates ? [
    { url: candidates.photo_1, label: candidates.source_1 || "Source 1" },
    { url: candidates.photo_2, label: candidates.source_2 || "Source 2" },
    { url: candidates.photo_3, label: candidates.source_3 || "Source 3" },
  ].filter(c => c.url && c.url.startsWith("http")) : [];

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-blue-800">
          <Image className="w-4 h-4" />
          Importer une photo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">

        {/* Photo actuelle */}
        {player.photo_url && (
          <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
            <img
              src={player.photo_url}
              alt={player.nom}
              className="w-12 h-12 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="text-xs text-slate-500">Photo actuelle</div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
          <button
            type="button"
            onClick={() => setManualMode(false)}
            className={`flex-1 py-1.5 transition-colors ${!manualMode ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            🤖 Recherche IA
          </button>
          <button
            type="button"
            onClick={() => setManualMode(true)}
            className={`flex-1 py-1.5 transition-colors ${manualMode ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            <span className="flex items-center justify-center gap-1"><Link2 className="w-3 h-3" /> URL manuelle</span>
          </button>
        </div>

        {/* Mode URL manuelle */}
        {manualMode && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Collez l'URL directe d'une image (.jpg, .png, .webp)</p>
            <Input
              value={manualUrl}
              onChange={(e) => { setManualUrl(e.target.value); setApplied(false); }}
              placeholder="https://upload.wikimedia.org/..."
              className="text-xs"
            />
            {manualUrl && manualUrl.startsWith("http") && (
              <div className="flex justify-center p-2 bg-white rounded-lg border">
                <img
                  src={manualUrl}
                  alt="Aperçu"
                  className="h-24 w-24 rounded-lg object-cover" referrerPolicy="no-referrer"
                  onError={(e) => { e.target.src = ""; e.currentTarget.parentElement.innerHTML = '<p class="text-xs text-red-500 p-2">Image non accessible</p>'; }}
                />
              </div>
            )}
            {applied ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700 font-medium">Photo mise à jour !</span>
                <Button onClick={() => setApplied(false)} size="sm" variant="ghost" className="ml-auto h-6 text-xs">Changer</Button>
              </div>
            ) : (
              <Button
                onClick={handleManualApply}
                disabled={!manualUrl.trim() || applying}
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1.5" />Appliquer cette photo</>}
              </Button>
            )}
          </div>
        )}

        {/* Mode recherche IA */}
        {!manualMode && (
          <>
            {!candidates && !loading && (
              <>
                <p className="text-xs text-slate-500">Recherche automatique d'une photo pour <strong>{player.nom}</strong> via Wikipedia & sites officiels.</p>
                <Button onClick={handleSearch} className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                  <Image className="w-4 h-4 mr-2" />Rechercher la photo
                </Button>
              </>
            )}

            {loading && (
              <div className="flex flex-col items-center py-4 gap-2">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <p className="text-xs text-slate-500">Recherche en cours…</p>
              </div>
            )}

            {candidates && !applied && (
              <div className="space-y-3">
                {candidateList.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-700">Aucune photo trouvée. Essayez l'URL manuelle ou relancez.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-medium text-slate-600">Sélectionnez une photo :</p>
                    <div className="space-y-2">
                      {candidateList.map((candidate, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                            selected === candidate.url ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"
                          } ${imageErrors[i] ? "opacity-50" : ""}`}
                          onClick={() => !imageErrors[i] && setSelected(candidate.url)}
                        >
                          <div className="w-14 h-14 rounded-lg border border-slate-200 bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {imageErrors[i] ? (
                              <AlertCircle className="w-5 h-5 text-slate-400" />
                            ) : (
                              <img
                                src={candidate.url}
                                alt={`Photo ${i + 1}`}
                                className="w-full h-full object-cover" referrerPolicy="no-referrer"
                                onError={() => setImageErrors(prev => ({ ...prev, [i]: true }))}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-700">{candidate.label}</div>
                            <div className="text-[10px] text-slate-400 truncate">{candidate.url}</div>
                            {imageErrors[i] && <div className="text-[10px] text-red-400">Image non accessible</div>}
                          </div>
                          {selected === candidate.url && <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {candidates.profil_transfermarkt && (
                  <a href={candidates.profil_transfermarkt} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink className="w-3 h-3" />Voir sur Transfermarkt
                  </a>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => selected && handleApply(selected)}
                    disabled={!selected || applying}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1" />Appliquer</>}
                  </Button>
                  <Button onClick={handleSearch} size="sm" variant="outline" disabled={loading} title="Relancer la recherche">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {applied && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">Photo mise à jour !</span>
                <Button onClick={() => { setCandidates(null); setApplied(false); }} size="sm" variant="ghost" className="ml-auto h-6 text-xs">Changer</Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}