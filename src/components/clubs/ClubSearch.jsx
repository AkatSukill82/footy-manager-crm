import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Plus, CheckCircle, Globe, Trophy, Users, Banknote, Calendar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function ClubSearch({ onClose }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setSaved(false);

    const data = await base44.integrations.Core.InvokeLLM({
      prompt: `Recherche des informations complètes sur le club de football "${query}" en utilisant Transfermarkt et Sofascore.
      
Retourne les données dans le format JSON demandé. Sois précis et utilise des données réelles et à jour.
Si le club n'existe pas ou n'est pas trouvé, retourne null pour tous les champs.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          nom: { type: "string" },
          pays: { type: "string" },
          ville: { type: "string" },
          stade: { type: "string" },
          capacite_stade: { type: "number" },
          annee_fondation: { type: "number" },
          president: { type: "string" },
          entraineur: { type: "string" },
          directeur_sportif: { type: "string" },
          budget_annuel: { type: "number", description: "en millions EUR" },
          budget_transfert: { type: "number", description: "en millions EUR" },
          dette: { type: "number", description: "en millions EUR" },
          valeur_effectif: { type: "number", description: "valeur totale effectif en millions EUR selon Transfermarkt" },
          palmares: { type: "string", description: "titres majeurs séparés par virgules" },
          historique: { type: "string", description: "courte description du club (2-3 phrases)" },
          categorie: { type: "string", enum: ["Elite", "Premier plan", "Intermédiaire", "En développement"] },
          logo_url: { type: "string", description: "URL directe vers le logo du club (Transfermarkt ou autre source fiable)" }
        }
      }
    });

    setResult(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    await base44.entities.Club.create(result);
    queryClient.invalidateQueries({ queryKey: ['clubs'] });
    setSaved(true);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Nom du club (ex: Paris Saint-Germain, Real Madrid…)"
            className="pl-9"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="bg-slate-900 hover:bg-slate-800"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-8 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-green-600" />
          <span>Recherche sur Transfermarkt & Sofascore…</span>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <Card className="border-2 border-green-100">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {result.logo_url && (
                  <img src={result.logo_url} alt={result.nom} className="w-14 h-14 object-contain rounded-lg bg-slate-50 p-1 border" />
                )}
                <div>
                  <CardTitle className="text-xl">{result.nom}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Globe className="w-3 h-3" />
                      <span>{result.pays}</span>
                    </div>
                    {result.ville && <span className="text-slate-400 text-xs">• {result.ville}</span>}
                    {result.categorie && (
                      <Badge className={
                        result.categorie === "Elite" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                        result.categorie === "Premier plan" ? "bg-blue-100 text-blue-800 border-blue-200" :
                        result.categorie === "Intermédiaire" ? "bg-green-100 text-green-800 border-green-200" :
                        "bg-slate-100 text-slate-700 border-slate-200"
                      }>
                        {result.categorie}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Key stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {result.valeur_effectif && (
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <Banknote className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Valeur effectif</p>
                  <p className="font-bold text-green-700">{result.valeur_effectif} M€</p>
                </div>
              )}
              {result.budget_transfert && (
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <Banknote className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Budget transfert</p>
                  <p className="font-bold text-blue-700">{result.budget_transfert} M€</p>
                </div>
              )}
              {result.capacite_stade && (
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <Users className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Capacité stade</p>
                  <p className="font-bold text-slate-700">{result.capacite_stade.toLocaleString()}</p>
                </div>
              )}
              {result.annee_fondation && (
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <Calendar className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Fondé en</p>
                  <p className="font-bold text-slate-700">{result.annee_fondation}</p>
                </div>
              )}
            </div>

            {/* Staff */}
            {(result.entraineur || result.president || result.directeur_sportif) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                {result.entraineur && (
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-400">Entraîneur</p>
                    <p className="font-medium">{result.entraineur}</p>
                  </div>
                )}
                {result.president && (
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-400">Président</p>
                    <p className="font-medium">{result.president}</p>
                  </div>
                )}
                {result.directeur_sportif && (
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-400">Directeur sportif</p>
                    <p className="font-medium">{result.directeur_sportif}</p>
                  </div>
                )}
              </div>
            )}

            {/* Stadium */}
            {result.stade && (
              <div className="text-sm text-slate-600">
                🏟️ <span className="font-medium">{result.stade}</span>
                {result.capacite_stade && <span className="text-slate-400"> ({result.capacite_stade.toLocaleString()} places)</span>}
              </div>
            )}

            {/* Palmares */}
            {result.palmares && (
              <div className="flex items-start gap-2">
                <Trophy className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600">{result.palmares}</p>
              </div>
            )}

            {/* Historique */}
            {result.historique && (
              <p className="text-sm text-slate-500 italic border-l-2 border-slate-200 pl-3">{result.historique}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {saved ? (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle className="w-5 h-5" />
                  Club enregistré avec succès !
                </div>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Enregistrer dans la base de données
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => { setResult(null); setQuery(""); setSaved(false); }}
              >
                Nouvelle recherche
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}