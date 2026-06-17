import React, { useState } from "react";
import { base44, invokeFn } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, Plus, CheckCircle, Globe, Trophy,
  Users, Banknote, Calendar, Building2, ArrowRight, Zap, AlertCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function ClubSearch({ onClose }) {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();

  const [query, setQuery]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const [candidates, setCandidates]   = useState(null);
  const [result, setResult]           = useState(null);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState(null);
  const [enriching, setEnriching]     = useState(false);

  // ── Étape 1 : recherche via FotMob ────────────────────────────────────────
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setCandidates(null);
    setSaved(false);
    setError(null);

    try {
      const data = await invokeFn("fotmobProxy", {
        action: "searchTeam",
        query:  query.trim(),
      });
      const list = data?.teams || [];

      if (list.length === 0) {
        setError(`Aucun club trouvé pour "${query}".`);
        setLoading(false);
        return;
      }

      if (list.length === 1) {
        setLoading(false);
        selectClub(list[0]);
      } else {
        setCandidates(list);
        setLoading(false);
      }
    } catch (err) {
      setError("Erreur lors de la recherche : " + (err?.message || "inconnue"));
      setLoading(false);
    }
  };

  // ── Étape 2 : sélection d'un club depuis la liste ──────────────────────────
  const selectClub = (team) => {
    setResult({
      nom:     team.nom,
      pays:    team.pays,
      logo_url: team.logo,
      _fmId:   team.id,
    });
  };

  // ── Enrichissement IA optionnel (bouton manuel) ────────────────────────────
  const handleEnrichWithAI = async () => {
    if (!result || enriching) return;
    setEnriching(true);
    try {
      const llmResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Données complémentaires pour le club de football "${result.nom}" (${result.pays || ''}).

IMPORTANT : retourne uniquement ce que tu sais avec certitude. Si une information est incertaine ou inconnue → null. Ne génère jamais de données inventées.

Champs attendus :
- entraineur : entraîneur actuel (string ou null)
- president : président du club (string ou null)
- directeur_sportif : directeur sportif (string ou null)
- budget_transfert : budget transfert en millions € (number ou null)
- valeur_effectif : valeur totale de l'effectif en millions € selon Transfermarkt (number ou null)
- palmares : palmarès collectif majeur, titres séparés par virgules (string ou null)
- historique : description courte du club en 2-3 phrases (string ou null)
- categorie : niveau du club parmi "Elite" | "Premier plan" | "Intermédiaire" | "En développement"`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            entraineur:        { type: "string" },
            president:         { type: "string" },
            directeur_sportif: { type: "string" },
            budget_transfert:  { type: "number" },
            valeur_effectif:   { type: "number" },
            palmares:          { type: "string" },
            historique:        { type: "string" },
            categorie: {
              type: "string",
              enum: ["Elite", "Premier plan", "Intermédiaire", "En développement"],
            },
          },
        },
      });
      if (llmResult) {
        setResult(prev => ({
          ...prev,
          ...Object.fromEntries(Object.entries(llmResult).filter(([, v]) => v != null)),
        }));
      }
    } catch {
      // ignore
    } finally {
      setEnriching(false);
    }
  };

  // ── Sauvegarde ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const clubData = Object.fromEntries(
        Object.entries({
          nom:               result.nom,
          pays:              result.pays,
          ville:             result.ville,
          stade:             result.stade,
          capacite_stade:    result.capacite_stade,
          annee_fondation:   result.annee_fondation,
          valeur_effectif:   result.valeur_effectif,
          budget_transfert:  result.budget_transfert,
          logo_url:          result.logo_url,
          entraineur:        result.entraineur,
          president:         result.president,
          directeur_sportif: result.directeur_sportif,
          palmares:          result.palmares,
          historique:        result.historique,
          categorie:         result.categorie,
        }).filter(([, v]) => v != null && v !== "")
      );
      await base44.entities.Club.create(clubData);
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setSaved(true);
    } catch (err) {
      setError("Erreur lors de la sauvegarde : " + (err?.message || "inconnue"));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setResult(null); setQuery(""); setSaved(false);
    setCandidates(null); setError(null);
  };

  return (
    <div className="space-y-4">

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ex: Real Madrid, Manchester City, PSG…"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading || loadingFull || !query.trim()}
          className="bg-slate-900 hover:bg-slate-800">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </form>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {(loading || loadingFull) && (
        <div className="flex items-center justify-center gap-3 py-8 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-green-600" />
          <span>Recherche en cours…</span>
        </div>
      )}

      {/* Candidats */}
      {candidates && candidates.length > 0 && !result && !loadingFull && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-green-500" />
              {candidates.length} club{candidates.length > 1 ? "s" : ""} trouvé{candidates.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidates.map((c, i) => (
              <button
                key={c.id || i}
                onClick={() => selectClub(c)}
                className="w-full flex items-center gap-4 p-3 rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex-shrink-0 overflow-hidden border border-slate-100 flex items-center justify-center p-1">
                  {c.logo
                    ? <img src={c.logo} alt={c.nom} className="w-full h-full object-contain"
                        referrerPolicy="no-referrer" onError={e => e.target.style.display = 'none'} />
                    : <Building2 className="w-6 h-6 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 group-hover:text-green-700">{c.nom}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {c.pays && <Badge variant="outline" className="text-xs">{c.pays}</Badge>}
                    {c.ville && <span className="text-xs text-slate-500">{c.ville}</span>}
                    {c.annee_fondation && <Badge className="bg-slate-100 text-slate-600 text-xs">Fondé {c.annee_fondation}</Badge>}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-green-500 flex-shrink-0" />
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Profil complet */}
      {result && !loading && !loadingFull && (
        <Card className="border-2 border-green-100">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 flex-shrink-0">
                {result.logo_url
                  ? <img src={result.logo_url} alt={result.nom} className="w-full h-full object-contain"
                      referrerPolicy="no-referrer" onError={e => e.target.style.display = 'none'} />
                  : <Building2 className="w-8 h-8 text-slate-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl">{result.nom}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {result.pays && (
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Globe className="w-3 h-3" />
                      <span>{result.pays}</span>
                    </div>
                  )}
                  {result.ville && <span className="text-slate-400 text-xs">· {result.ville}</span>}
                  {result.categorie && (
                    <Badge className={
                      result.categorie === "Elite"         ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                      result.categorie === "Premier plan"  ? "bg-blue-100 text-blue-800 border-blue-200" :
                      result.categorie === "Intermédiaire" ? "bg-green-100 text-green-800 border-green-200" :
                      "bg-slate-100 text-slate-700 border-slate-200"
                    }>{result.categorie}</Badge>
                  )}
                  <span className="text-[10px] text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">
                    FotMob
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Stats clés */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {result.valeur_effectif != null && (
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <Banknote className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">{t(lang, 'clubs.squadValue')}</p>
                  <p className="font-bold text-green-700">{result.valeur_effectif} M€</p>
                </div>
              )}
              {result.budget_transfert != null && (
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <Banknote className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">{t(lang, 'clubs.transferBudgetLabel')}</p>
                  <p className="font-bold text-blue-700">{result.budget_transfert} M€</p>
                </div>
              )}
              {result.capacite_stade != null && (
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <Users className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">{t(lang, 'clubs.stadiumCapacity')}</p>
                  <p className="font-bold text-slate-700">{result.capacite_stade.toLocaleString()}</p>
                </div>
              )}
              {result.annee_fondation != null && (
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <Calendar className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">{t(lang, 'clubs.foundedLabel')}</p>
                  <p className="font-bold text-slate-700">{result.annee_fondation}</p>
                </div>
              )}
            </div>

            {/* Stade */}
            {result.stade && (
              <div className="text-sm text-slate-600">
                🏟️ <span className="font-medium">{result.stade}</span>
                {result.capacite_stade && (
                  <span className="text-slate-400"> ({result.capacite_stade.toLocaleString()} {t(lang, 'clubs.capacityUnit')})</span>
                )}
              </div>
            )}

            {/* Staff (après enrichissement IA) */}
            {(result.entraineur || result.president || result.directeur_sportif) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                {result.entraineur && (
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-400">{t(lang, 'clubs.coachLabel')}</p>
                    <p className="font-medium">{result.entraineur}</p>
                  </div>
                )}
                {result.president && (
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-400">{t(lang, 'clubs.presidentLabel')}</p>
                    <p className="font-medium">{result.president}</p>
                  </div>
                )}
                {result.directeur_sportif && (
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-400">{t(lang, 'clubs.sportingDirLabel')}</p>
                    <p className="font-medium">{result.directeur_sportif}</p>
                  </div>
                )}
              </div>
            )}

            {/* Palmarès + historique (après enrichissement IA) */}
            {result.palmares && (
              <div className="flex items-start gap-2">
                <Trophy className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600">{result.palmares}</p>
              </div>
            )}
            {result.historique && (
              <p className="text-sm text-slate-500 italic border-l-2 border-slate-200 pl-3">
                {result.historique}
              </p>
            )}

            {/* Bouton enrichissement IA optionnel */}
            {!result.entraineur && !result.palmares && (
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-4 py-3">
                <div className="flex-1">
                  <p className="font-medium text-slate-700 text-sm">Infos complémentaires IA (optionnel)</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Entraîneur, président, palmarès, budget — généré par IA. À vérifier avant utilisation.
                  </p>
                </div>
                <Button onClick={handleEnrichWithAI} disabled={enriching} variant="outline" size="sm"
                  className="flex-shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50">
                  {enriching
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyse…</>
                    : <><Zap className="w-4 h-4 mr-2" />Enrichir avec IA</>}
                </Button>
              </div>
            )}

            {/* Disclaimer si IA utilisée */}
            {(result.entraineur || result.palmares) && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Données de staff/palmarès générées par IA — vérifier avant utilisation professionnelle.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {saved ? (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle className="w-5 h-5" />
                  {t(lang, 'clubs.savedSuccess')}
                </div>
              ) : (
                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t(lang, 'clubs.saveBtn')}</>
                    : <><Plus className="w-4 h-4 mr-2" />{t(lang, 'clubs.saveBtn')}</>}
                </Button>
              )}
              <Button variant="outline" onClick={reset}>{t(lang, 'clubs.newSearch')}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
