import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles, Loader2, Star, AlertTriangle, ChevronRight,
  Users, Target, Eye, Phone, ShoppingCart, TrendingUp, Shield
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";

const POSTES = [
  "Gardien", "Défenseur central", "Latéral droit", "Latéral gauche",
  "Milieu défensif", "Milieu central", "Milieu offensif",
  "Ailier droit", "Ailier gauche", "Attaquant"
];

const SYSTEMES = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "3-4-3", "5-3-2"];

const PRIORITES_CONFIG = [
  { value: "Performance",          labelKey: "scouting.prioritePerformance" },
  { value: "Potentiel",            labelKey: "scouting.prioritePotential" },
  { value: "Rapport qualité/prix", labelKey: "scouting.prioriteValue" },
  { value: "Expérience",           labelKey: "scouting.prioriteExperience" },
  { value: "Polyvalence",          labelKey: "scouting.prioriteVersatility" },
];

const RECO_CONFIG = {
  "Observer":        { labelKey: "scouting.recoWatch",   color: "bg-slate-700 text-slate-100", icon: Eye },
  "Contacter agent": { labelKey: "scouting.recoContact", color: "bg-amber-500 text-white",     icon: Phone },
  "Faire offre":     { labelKey: "scouting.recoOffer",   color: "bg-emerald-500 text-white",   icon: ShoppingCart },
};

function ScoreBar({ score }) {
  const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-500";
  const textColor = score >= 75 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold w-12 text-right ${textColor}`}>{score}/100</span>
    </div>
  );
}

function PlayerResultCard({ player, onWatchlist, watchlisted }) {
  const { lang } = useLanguage();
  const reco = RECO_CONFIG[player.recommandation] || RECO_CONFIG["Observer"];
  const RecoIcon = reco.icon;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4 hover:border-emerald-500/40 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">{player.nom}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge className="bg-slate-700 text-slate-300 text-xs">{player.poste}</Badge>
            {player.club && <Badge className="bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 text-xs">{player.club}</Badge>}
            {player.age && <Badge className="bg-slate-700 text-slate-400 text-xs">{player.age} {t(lang, 'common.ageUnit')}</Badge>}
            {player.valeur && <Badge className="bg-slate-700 text-emerald-400 text-xs">{player.valeur} M€</Badge>}
          </div>
        </div>
        <Badge className={`${reco.color} flex items-center gap-1.5 flex-shrink-0 text-xs px-2.5 py-1`}>
          <RecoIcon className="w-3 h-3" />
          {t(lang, reco.labelKey)}
        </Badge>
      </div>

      {/* Score */}
      <div>
        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">{t(lang, 'scouting.compatScore')}</p>
        <ScoreBar score={player.score_compatibilite} />
      </div>

      {/* Points forts */}
      {player.points_forts?.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 uppercase font-semibold mb-2">{t(lang, 'scouting.strengths')}</p>
          <ul className="space-y-1">
            {player.points_forts.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Point de vigilance */}
      {player.point_vigilance && (
        <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">{player.point_vigilance}</p>
        </div>
      )}

      {/* Justification */}
      {player.justification && (
        <p className="text-xs text-slate-400 italic leading-relaxed">{player.justification}</p>
      )}

      {/* CTA */}
      <Button
        size="sm"
        onClick={() => onWatchlist(player.player_id)}
        disabled={watchlisted}
        className={`w-full ${watchlisted ? "bg-emerald-800 text-emerald-300" : "bg-emerald-600 hover:bg-emerald-500 text-white"}`}
      >
        <Star className={`w-3.5 h-3.5 mr-1.5 ${watchlisted ? "fill-current" : ""}`} />
        {watchlisted ? t(lang, 'scouting.addedToWatch') : t(lang, 'scouting.addToWatch')}
      </Button>
    </div>
  );
}

export default function ScoutingIAPage() {
  const { lang } = useLanguage();
  const [criteria, setCriteria] = useState({
    poste: "Attaquant",
    systeme: "4-3-3",
    age_max: 28,
    budget_max: 50,
    priorite: "Performance",
    ligue: "",
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [watchlisted, setWatchlisted] = useState({});
  const queryClient = useQueryClient();

  const set = (field) => (e) => setCriteria(prev => ({ ...prev, [field]: e.target.value }));

  const handleAnalyse = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    setWatchlisted({});

    const players = await base44.entities.Player.list();

    if (!players || players.length === 0) {
      setError(t(lang, 'scouting.noPlayers'));
      setLoading(false);
      return;
    }

    // Pré-filtrer avant d'envoyer à l'IA — réduit la taille du prompt et le coût
    const preFiltered = players.filter(pl => {
      if (pl.poste !== criteria.poste && pl.poste_secondaire !== criteria.poste) return false;
      if (criteria.age_max && pl.age && pl.age > Number(criteria.age_max)) return false;
      if (criteria.budget_max && pl.valeur_marchande && pl.valeur_marchande > Number(criteria.budget_max) * 1.5) return false;
      if (criteria.ligue && pl.ligue && !pl.ligue.toLowerCase().includes(criteria.ligue.toLowerCase())) return false;
      return true;
    });

    const pool = preFiltered.length > 0 ? preFiltered : players;

    const playersContext = pool.map(pl => ({
      id: pl.id,
      nom: pl.nom,
      poste: pl.poste,
      poste_secondaire: pl.poste_secondaire,
      age: pl.age,
      club: pl.club_actuel,
      ligue: pl.ligue,
      valeur: pl.valeur_marchande,
      note: pl.note_moyenne,
      buts: pl.buts,
      passes: pl.passes_decisives,
      xg: pl.xg,
      minutes: pl.minutes_jouees,
      matchs: pl.matchs_joues,
      contrat_fin: pl.contrat_fin,
      forces: pl.forces,
      note_scout: pl.note_globale_scout,
      nationalite: pl.nationalite,
      pied_fort: pl.pied_fort,
    }));

    const prompt = `Tu es un directeur sportif expert. Voici les critères du manager :
- Poste recherché: ${criteria.poste}
- Système de jeu: ${criteria.systeme}
- Âge maximum: ${criteria.age_max} ans
- Budget maximum: ${criteria.budget_max} M€
- Priorité principale: ${criteria.priorite}
${criteria.ligue ? `- Ligue préférée: ${criteria.ligue}` : ""}

Voici la liste pré-filtrée des joueurs disponibles dans la base (${pool.length} joueurs, JSON):
${JSON.stringify(playersContext, null, 2)}

Analyse ces joueurs et sélectionne les 3 à 5 meilleurs profils correspondant aux critères du manager.

Pour chaque joueur retenu, fournis:
- Un score de compatibilité /100
- 3 points forts par rapport aux critères
- 1 point de vigilance
- Une recommandation d'action parmi: "Observer", "Contacter agent", "Faire offre"

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks. Format exact:
{
  "analyse_globale": "string (2-3 phrases de contexte marché)",
  "joueurs": [
    {
      "player_id": "string (utilise le champ id du joueur)",
      "nom": "string",
      "poste": "string",
      "club": "string",
      "age": number,
      "valeur": number,
      "score_compatibilite": number,
      "points_forts": ["string", "string", "string"],
      "point_vigilance": "string",
      "recommandation": "Observer",
      "justification": "string"
    }
  ]
}`;

    try {
      const raw = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: "claude_sonnet_4_6",
        response_json_schema: {
          type: "object",
          properties: {
            analyse_globale: { type: "string" },
            joueurs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  player_id: { type: "string" },
                  nom: { type: "string" },
                  poste: { type: "string" },
                  club: { type: "string" },
                  age: { type: "number" },
                  valeur: { type: "number" },
                  score_compatibilite: { type: "number" },
                  points_forts: { type: "array", items: { type: "string" } },
                  point_vigilance: { type: "string" },
                  recommandation: { type: "string" },
                  justification: { type: "string" },
                }
              }
            }
          }
        }
      });
      setResults(raw);
    } catch (err) {
      setError(t(lang, 'scouting.analysisError') || "L'analyse IA a échoué. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlist = async (playerId) => {
    if (!playerId || watchlisted[playerId]) return;
    try {
      await base44.entities.WatchList.create({
        player_id: playerId,
        priorite: "Haute",
        statut: "En observation",
      });
      setWatchlisted(prev => ({ ...prev, [playerId]: true }));
      queryClient.invalidateQueries({ queryKey: ['watchList'] });
    } catch (err) {
      setError(err.message || "Erreur lors de l'ajout à la watchlist");
    }
  };

  const InputClass = "w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500";
  const LabelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{t(lang, 'scouting.title')}</h1>
            <p className="text-xs text-slate-500">{t(lang, 'scouting.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT PANEL ── */}
          <div className="lg:w-[30%] flex-shrink-0">
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-5 sticky top-24">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-200">{t(lang, 'scouting.criteria')}</h2>
              </div>

              <div>
                <label className={LabelClass}>{t(lang, 'scouting.position')}</label>
                <select value={criteria.poste} onChange={set("poste")} className={InputClass}>
                  {POSTES.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>

              <div>
                <label className={LabelClass}>{t(lang, 'scouting.system')}</label>
                <select value={criteria.systeme} onChange={set("systeme")} className={InputClass}>
                  {SYSTEMES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LabelClass}>{t(lang, 'scouting.ageMax')}</label>
                  <input type="number" min={16} max={45} value={criteria.age_max}
                    onChange={set("age_max")} className={InputClass} />
                </div>
                <div>
                  <label className={LabelClass}>{t(lang, 'scouting.budget')}</label>
                  <input type="number" min={0} value={criteria.budget_max}
                    onChange={set("budget_max")} className={InputClass} />
                </div>
              </div>

              <div>
                <label className={LabelClass}>{t(lang, 'scouting.priority')}</label>
                <select value={criteria.priorite} onChange={set("priorite")} className={InputClass}>
                  {PRIORITES_CONFIG.map(pr => <option key={pr.value} value={pr.value}>{t(lang, pr.labelKey)}</option>)}
                </select>
              </div>

              <div>
                <label className={LabelClass}>{t(lang, 'scouting.league')} <span className="normal-case text-slate-600 font-normal">{t(lang, 'scouting.optional')}</span></label>
                <input type="text" value={criteria.ligue} onChange={set("ligue")}
                  placeholder={t(lang, 'scouting.leaguePlh')} className={InputClass} />
              </div>

              <Button
                onClick={handleAnalyse}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl text-sm gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Sparkles className="w-4 h-4" />
                }
                {loading ? t(lang, 'scouting.analysingBtn') : t(lang, 'scouting.analyseBtn')}
              </Button>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="flex-1 min-w-0">

            {/* Empty */}
            {!loading && !results && !error && (
              <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 text-center">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-emerald-500/60" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-400 mb-2">{t(lang, 'scouting.readyTitle')}</h2>
                  <p className="text-sm text-slate-600 max-w-sm">{t(lang, 'scouting.readyDesc')}</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    t(lang, 'scouting.featScore'),
                    t(lang, 'scouting.featStrengths'),
                    t(lang, 'scouting.featReco'),
                    t(lang, 'scouting.featWatchlist'),
                  ].map(f => (
                    <Badge key={f} className="bg-slate-800 text-slate-400 border border-slate-700 text-xs">{f}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="relative w-16 h-16">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-slate-300 font-semibold mb-1">{t(lang, 'scouting.analysingLabel')}</p>
                  <p className="text-slate-500 text-sm">{t(lang, 'scouting.analysingDesc')}</p>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-slate-300 text-center max-w-sm">{error}</p>
              </div>
            )}

            {/* Results */}
            {results && !loading && (
              <div className="space-y-5">
                {results.analyse_globale && (
                  <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">{t(lang, 'scouting.marketAnalysis')}</p>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{results.analyse_globale}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-slate-400 text-sm">{t(lang, 'scouting.profilesCount', { count: results.joueurs?.length || 0 })}</span>
                  <div className="flex gap-2">
                    {["Faire offre", "Contacter agent", "Observer"].map(r => {
                      const count = results.joueurs?.filter(j => j.recommandation === r).length || 0;
                      if (!count) return null;
                      const cfg = RECO_CONFIG[r];
                      return <Badge key={r} className={`${cfg.color} text-xs`}>{count} {t(lang, cfg.labelKey)}</Badge>;
                    })}
                  </div>
                </div>

                <div className="grid gap-4">
                  {results.joueurs?.map((player, i) => (
                    <PlayerResultCard
                      key={player.player_id || i}
                      player={player}
                      onWatchlist={handleWatchlist}
                      watchlisted={watchlisted[player.player_id]}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
