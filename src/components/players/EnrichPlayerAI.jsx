import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, RefreshCw, TrendingUp, User, Calendar, MapPin, Ruler, Trophy } from "lucide-react";

export default function EnrichPlayerAI({ player, onApply }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleEnrich = async () => {
    setLoading(true);
    setResult(null);
    const data = await base44.integrations.Core.InvokeLLM({
      prompt: `Recherche des informations complètes et à jour sur le joueur de football "${player.nom}".
      Utilise des sources fiables comme Transfermarkt, Wikipedia, les sites officiels des clubs, etc.
      Retourne toutes les informations disponibles sur ce joueur.
      Si une information n'est pas trouvée, mets null.
      Pour la valeur marchande, donne-la en millions d'euros (nombre décimal).
      Pour la taille, donne-la en centimètres (nombre entier).
      Pour l'âge, donne un nombre entier.
      Pour les dates, utilise le format YYYY-MM-DD.
      Pour le pied_fort, utilise uniquement "Droit", "Gauche" ou "Les deux".
      Pour le poste, utilise exactement l'un de ces termes: Gardien, Défenseur central, Latéral droit, Latéral gauche, Milieu défensif, Milieu central, Milieu offensif, Ailier droit, Ailier gauche, Attaquant.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          nom: { type: "string" },
          age: { type: "number" },
          date_naissance: { type: "string" },
          nationalite: { type: "string" },
          poste: { type: "string" },
          club_actuel: { type: "string" },
          valeur_marchande: { type: "number" },
          pied_fort: { type: "string" },
          taille: { type: "number" },
          contrat_fin: { type: "string" },
          photo_url: { type: "string" },
          palmares: { type: "string" },
          stats_resume: { type: "string" },
          agent: { type: "string" },
          salaire_estime: { type: "string" },
        }
      }
    });
    setResult(data);
    setLoading(false);
  };

  const handleApply = () => {
    if (!result) return;
    const cleaned = {};
    const fields = ['nom', 'age', 'date_naissance', 'nationalite', 'poste', 'club_actuel', 'valeur_marchande', 'pied_fort', 'taille', 'contrat_fin', 'photo_url'];
    fields.forEach(f => { if (result[f] !== null && result[f] !== undefined) cleaned[f] = result[f]; });
    onApply(cleaned);
    setResult(null);
  };

  const diffLabel = (field, label, format) => {
    const newVal = result?.[field];
    if (newVal === null || newVal === undefined) return null;
    const oldVal = player[field];
    const changed = String(newVal) !== String(oldVal);
    return (
      <div key={field} className={`flex items-center justify-between py-2 border-b border-slate-100 last:border-0 ${changed ? "bg-green-50 -mx-3 px-3 rounded" : ""}`}>
        <span className="text-sm text-slate-600">{label}</span>
        <div className="flex items-center gap-2">
          {changed && oldVal && <span className="text-xs text-slate-400 line-through">{format ? format(oldVal) : oldVal}</span>}
          <span className={`text-sm font-semibold ${changed ? "text-green-700" : "text-slate-700"}`}>
            {format ? format(newVal) : newVal}
          </span>
          {changed && <Badge className="bg-green-100 text-green-700 text-[10px] px-1 py-0">Nouveau</Badge>}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-purple-800">
          <Sparkles className="w-4 h-4" />
          Enrichir avec l'IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!result && (
          <>
            <p className="text-xs text-slate-500">
              L'IA va rechercher toutes les infos disponibles sur <strong>{player.nom}</strong> (Transfermarkt, Wikipedia, presse sportive…) et mettra à jour son profil automatiquement.
            </p>
            <Button
              onClick={handleEnrich}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              size="sm"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recherche en cours…</>
                : <><Sparkles className="w-4 h-4 mr-2" /> Rechercher les infos</>}
            </Button>
          </>
        )}

        {result && (
          <div className="space-y-3">
            <div className="space-y-0">
              {diffLabel('club_actuel', 'Club actuel', null)}
              {diffLabel('valeur_marchande', 'Valeur marchande', v => `${v} M€`)}
              {diffLabel('age', 'Âge', v => `${v} ans`)}
              {diffLabel('nationalite', 'Nationalité', null)}
              {diffLabel('poste', 'Poste', null)}
              {diffLabel('pied_fort', 'Pied fort', null)}
              {diffLabel('taille', 'Taille', v => `${v} cm`)}
              {diffLabel('contrat_fin', 'Fin de contrat', null)}
            </div>

            {result.palmares && (
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                  <Trophy className="w-3 h-3 text-yellow-500" /> Palmarès
                </div>
                <p className="text-xs text-slate-600">{result.palmares}</p>
              </div>
            )}

            {result.stats_resume && (
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="text-xs font-semibold text-slate-700 mb-1">📊 Stats</div>
                <p className="text-xs text-slate-600">{result.stats_resume}</p>
              </div>
            )}

            {result.agent && (
              <div className="text-xs text-slate-500">👔 Agent : <span className="font-medium text-slate-700">{result.agent}</span></div>
            )}
            {result.salaire_estime && (
              <div className="text-xs text-slate-500">💰 Salaire estimé : <span className="font-medium text-slate-700">{result.salaire_estime}</span></div>
            )}

            <div className="flex gap-2 pt-1">
              <Button onClick={handleApply} size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Appliquer
              </Button>
              <Button onClick={handleEnrich} size="sm" variant="outline" className="flex-1" disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-1" /> Relancer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}