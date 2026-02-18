import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Loader2, CheckCircle2, RefreshCw, ExternalLink } from "lucide-react";

export default function ImportTransfermarktPhoto({ player, onApply }) {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState(null);
  const [selected, setSelected] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setCandidates(null);
    setSelected(null);
    setApplied(false);

    const data = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert en football. Recherche la photo officielle du joueur "${player.nom}" ${player.club_actuel ? `(${player.club_actuel})` : ""} ${player.nationalite ? `nationalité ${player.nationalite}` : ""} sur Transfermarkt (transfermarkt.fr ou transfermarkt.com).

      Fournis :
      1. L'URL directe de la photo du joueur sur Transfermarkt (format : https://img.a.transfermarkt.technology/portrait/... ou similaire)
      2. L'URL de son profil Transfermarkt
      3. Si possible, une 2ème URL de photo alternative (Wikipedia, site club, etc.)

      IMPORTANT : Les URLs de photos Transfermarkt ressemblent à :
      - https://img.a.transfermarkt.technology/portrait/header/...
      - https://img.a.transfermarkt.technology/portrait/big/...
      
      Assure-toi que les URLs sont directement accessibles et valides.
      Si tu ne trouves pas de photo Transfermarkt, cherche sur Wikipedia ou le site officiel du club.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          photo_principale: { type: "string", description: "URL directe de la photo Transfermarkt" },
          photo_alternative: { type: "string", description: "URL alternative (Wikipedia, club, etc.)" },
          profil_transfermarkt: { type: "string", description: "URL du profil Transfermarkt" },
          source_principale: { type: "string", description: "Source de la photo principale (ex: Transfermarkt, Wikipedia)" },
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

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-blue-800">
          <Image className="w-4 h-4" />
          Photo Transfermarkt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">

        {/* Current photo preview */}
        {player.photo_url && (
          <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
            <img
              src={player.photo_url}
              alt={player.nom}
              className="w-12 h-12 rounded-lg object-cover border border-slate-200"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="text-xs text-slate-500">Photo actuelle enregistrée</div>
          </div>
        )}

        {!candidates && !loading && (
          <>
            <p className="text-xs text-slate-500">
              Recherche la photo officielle de <strong>{player.nom}</strong> sur Transfermarkt et l'importe dans son profil.
            </p>
            <Button
              onClick={handleSearch}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Image className="w-4 h-4 mr-2" />
              Rechercher la photo
            </Button>
          </>
        )}

        {loading && (
          <div className="flex flex-col items-center py-4 gap-2">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-500">Recherche sur Transfermarkt…</p>
          </div>
        )}

        {candidates && !applied && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-600">Sélectionne la photo à utiliser :</p>

            <div className="space-y-2">
              {[
                { url: candidates.photo_principale, label: candidates.source_principale || "Transfermarkt" },
                { url: candidates.photo_alternative, label: "Alternative" },
              ].filter(c => c.url).map((candidate, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selected === candidate.url
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-blue-300"
                  }`}
                  onClick={() => setSelected(candidate.url)}
                >
                  <img
                    src={candidate.url}
                    alt={`Photo ${i + 1}`}
                    className="w-14 h-14 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                    onError={(e) => { e.target.src = ""; e.target.style.display = 'none'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700">{candidate.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{candidate.url}</div>
                  </div>
                  {selected === candidate.url && (
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {candidates.profil_transfermarkt && (
              <a
                href={candidates.profil_transfermarkt}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Voir le profil Transfermarkt
              </a>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => selected && handleApply(selected)}
                disabled={!selected || applying}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {applying
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><CheckCircle2 className="w-4 h-4 mr-1" /> Appliquer</>}
              </Button>
              <Button onClick={handleSearch} size="sm" variant="outline" disabled={loading}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {applied && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Photo mise à jour !</span>
            <Button onClick={() => { setCandidates(null); setApplied(false); }} size="sm" variant="ghost" className="ml-auto h-6 text-xs">
              Changer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}