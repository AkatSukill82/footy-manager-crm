import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, RefreshCw, Trophy, ChevronDown, ChevronUp } from "lucide-react";

const ALL_FIELDS = [
  { key: "nom", label: "Nom" },
  { key: "age", label: "Âge", fmt: v => `${v} ans` },
  { key: "date_naissance", label: "Date de naissance" },
  { key: "nationalite", label: "Nationalité" },
  { key: "poste", label: "Poste" },
  { key: "poste_secondaire", label: "Poste secondaire" },
  { key: "club_actuel", label: "Club actuel" },
  { key: "ligue", label: "Ligue" },
  { key: "stade", label: "Stade" },
  { key: "coach", label: "Entraîneur" },
  { key: "manager", label: "Manager / DS" },
  { key: "valeur_marchande", label: "Valeur marchande", fmt: v => `${v} M€` },
  { key: "pied_fort", label: "Pied fort" },
  { key: "taille", label: "Taille", fmt: v => `${v} cm` },
  { key: "poids", label: "Poids", fmt: v => `${v} kg` },
  { key: "contrat_fin", label: "Fin de contrat" },
  { key: "salaire", label: "Salaire annuel", fmt: v => `${v} M€` },
  { key: "agent", label: "Agent" },
  { key: "numero_maillot", label: "N° maillot" },
  { key: "matchs_joues", label: "Matchs joués (saison)" },
  { key: "buts", label: "Buts (saison)" },
  { key: "passes_decisives", label: "Passes déc. (saison)" },
  { key: "cartons_jaunes", label: "Cartons jaunes" },
  { key: "cartons_rouges", label: "Cartons rouges" },
  { key: "blessures", label: "Blessures (carrière)" },
  { key: "note_moyenne", label: "Note SofaScore" },
  { key: "matchs_carriere", label: "Matchs (carrière)" },
  { key: "buts_carriere", label: "Buts (carrière)" },
  { key: "passes_carriere", label: "Passes (carrière)" },
  { key: "nb_clubs", label: "Clubs différents" },
  { key: "matchs_international", label: "Sélections nat." },
  { key: "buts_international", label: "Buts en sélection" },
  { key: "transfermarkt_id", label: "ID Transfermarkt" },
  { key: "palmares", label: "Palmarès" },
  { key: "stats_resume", label: "Résumé carrière" },
];

export default function EnrichPlayerAI({ player, onApply }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [applied, setApplied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleEnrich = async () => {
    setLoading(true);
    setResult(null);
    setApplied(false);

    const data = await base44.integrations.Core.InvokeLLM({
      prompt: `Recherche des informations COMPLÈTES et à jour sur le joueur de football "${player.nom}"${player.club_actuel ? ` (${player.club_actuel})` : ""}${player.nationalite ? `, nationalité ${player.nationalite}` : ""}.

Utilise Transfermarkt, Wikipedia, SofaScore, les sites officiels, la presse sportive.
Retourne TOUTES les informations disponibles. Si une info est inconnue, mets null.

Règles de format :
- valeur_marchande : en millions d'euros (nombre décimal, ex: 80.5)
- salaire : salaire annuel en millions d'euros (nombre décimal, ex: 12.0)
- taille : en cm (entier, ex: 181), poids : en kg (entier, ex: 73)
- age : entier, dates : format YYYY-MM-DD
- pied_fort : "Droit", "Gauche" ou "Les deux" uniquement
- poste / poste_secondaire : parmi : Gardien, Défenseur central, Latéral droit, Latéral gauche, Milieu défensif, Milieu central, Milieu offensif, Ailier droit, Ailier gauche, Attaquant
- matchs_joues / buts / passes_decisives / cartons_jaunes / cartons_rouges : entiers pour la saison en cours
- blessures : nombre total de blessures en carrière (entier)
- matchs_carriere / buts_carriere / passes_carriere : totaux sur toute la carrière
- nb_clubs : nombre total de clubs différents dans la carrière
- matchs_international / buts_international : stats en équipe nationale
- note_moyenne : note SofaScore (décimal, ex: 7.42)
- coach : entraîneur principal du club actuel
- manager : directeur sportif ou manager du club actuel
- stade : nom du stade du club actuel
- ligue : nom du championnat actuel (ex: Ligue 1, Premier League)
- palmares : tous les titres séparés par des virgules
- stats_resume : résumé complet de la carrière en 2-3 phrases
- transfermarkt_id : uniquement le numéro de l'ID (ex: 342229)`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          nom: { type: "string" },
          age: { type: "number" },
          date_naissance: { type: "string" },
          nationalite: { type: "string" },
          poste: { type: "string" },
          poste_secondaire: { type: "string" },
          club_actuel: { type: "string" },
          ligue: { type: "string" },
          stade: { type: "string" },
          coach: { type: "string" },
          manager: { type: "string" },
          valeur_marchande: { type: "number" },
          pied_fort: { type: "string" },
          taille: { type: "number" },
          poids: { type: "number" },
          contrat_fin: { type: "string" },
          salaire: { type: "number" },
          agent: { type: "string" },
          numero_maillot: { type: "number" },
          matchs_joues: { type: "number" },
          buts: { type: "number" },
          passes_decisives: { type: "number" },
          cartons_jaunes: { type: "number" },
          cartons_rouges: { type: "number" },
          blessures: { type: "number" },
          note_moyenne: { type: "number" },
          matchs_carriere: { type: "number" },
          buts_carriere: { type: "number" },
          passes_carriere: { type: "number" },
          nb_clubs: { type: "number" },
          matchs_international: { type: "number" },
          buts_international: { type: "number" },
          transfermarkt_id: { type: "string" },
          palmares: { type: "string" },
          stats_resume: { type: "string" },
        }
      }
    });

    setResult(data);
    setLoading(false);
  };

  const handleApply = () => {
    if (!result) return;
    const cleaned = {};
    ALL_FIELDS.forEach(({ key }) => {
      if (result[key] !== null && result[key] !== undefined && result[key] !== "") {
        cleaned[key] = result[key];
      }
    });
    onApply(cleaned);
    setApplied(true);
    setResult(null);
  };

  // Separate changed vs unchanged fields for display
  const changedFields = ALL_FIELDS.filter(({ key }) => {
    const nv = result?.[key];
    if (nv === null || nv === undefined || nv === "") return false;
    return String(nv) !== String(player[key] ?? "");
  });
  const unchangedFields = ALL_FIELDS.filter(({ key }) => {
    const nv = result?.[key];
    if (nv === null || nv === undefined || nv === "") return false;
    return String(nv) === String(player[key] ?? "");
  });

  const DiffRow = ({ fieldDef }) => {
    const { key, label, fmt } = fieldDef;
    const newVal = result?.[key];
    if (newVal === null || newVal === undefined || newVal === "") return null;
    const oldVal = player[key];
    const changed = String(newVal) !== String(oldVal ?? "");
    return (
      <div className={`flex items-start justify-between py-2 border-b border-slate-100 last:border-0 gap-2 ${changed ? "bg-green-50 -mx-2 px-2 rounded" : ""}`}>
        <span className="text-xs text-slate-500 flex-shrink-0 w-32">{label}</span>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {changed && oldVal !== undefined && oldVal !== null && oldVal !== "" && (
            <span className="text-[10px] text-slate-400 line-through">{fmt ? fmt(oldVal) : oldVal}</span>
          )}
          <span className={`text-xs font-semibold ${changed ? "text-green-700" : "text-slate-700"}`}>
            {fmt ? fmt(newVal) : newVal}
          </span>
          {changed && <Badge className="bg-green-100 text-green-700 text-[10px] px-1 py-0 leading-tight">Nouveau</Badge>}
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

        {!result && !applied && (
          <>
            <p className="text-xs text-slate-500">
              L'IA recherche toutes les infos disponibles sur <strong>{player.nom}</strong> et les intègre directement dans le profil.
            </p>
            <Button onClick={handleEnrich} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="sm">
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Recherche en cours…</>
                : <><Sparkles className="w-4 h-4 mr-2" />Rechercher toutes les infos</>}
            </Button>
          </>
        )}

        {applied && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Profil mis à jour avec succès !</span>
            </div>
            <Button onClick={() => { setApplied(false); }} size="sm" variant="outline" className="w-full text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Relancer une recherche
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            {/* Nouvelles / modifiées */}
            {changedFields.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1">
                  ✅ {changedFields.length} champ{changedFields.length > 1 ? "s" : ""} à mettre à jour
                </p>
                <div className="bg-white rounded-lg border border-slate-200 px-2 py-1">
                  {changedFields.map(f => <DiffRow key={f.key} fieldDef={f} />)}
                </div>
              </div>
            )}

            {/* Inchangées (repliables) */}
            {unchangedFields.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {unchangedFields.length} champ{unchangedFields.length > 1 ? "s" : ""} déjà à jour
                </button>
                {showAll && (
                  <div className="bg-slate-50 rounded-lg border border-slate-100 px-2 py-1 mt-1">
                    {unchangedFields.map(f => <DiffRow key={f.key} fieldDef={f} />)}
                  </div>
                )}
              </div>
            )}

            {changedFields.length === 0 && unchangedFields.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-2">Aucune donnée trouvée par l'IA.</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleApply}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={changedFields.length === 0}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Tout intégrer ({changedFields.length + unchangedFields.length} champs)
              </Button>
              <Button onClick={handleEnrich} size="sm" variant="outline" disabled={loading}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}