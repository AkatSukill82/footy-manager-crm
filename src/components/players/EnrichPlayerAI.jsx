import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

const ALL_FIELDS = [
  // Identité
  { key: "nom", label: "Nom", group: "Identité" },
  { key: "age", label: "Âge", fmt: v => `${v} ans`, group: "Identité" },
  { key: "date_naissance", label: "Date de naissance", group: "Identité" },
  { key: "lieu_naissance", label: "Lieu de naissance", group: "Identité" },
  { key: "nationalite", label: "Nationalité", group: "Identité" },
  { key: "nationalite_secondaire", label: "2e nationalité", group: "Identité" },
  { key: "poste", label: "Poste", group: "Identité" },
  { key: "poste_secondaire", label: "Poste secondaire", group: "Identité" },
  { key: "pied_fort", label: "Pied fort", group: "Identité" },
  { key: "taille", label: "Taille", fmt: v => `${v} cm`, group: "Identité" },
  { key: "poids", label: "Poids", fmt: v => `${v} kg`, group: "Identité" },
  // Club & contrat
  { key: "club_actuel", label: "Club actuel", group: "Club & contrat" },
  { key: "ligue", label: "Ligue", group: "Club & contrat" },
  { key: "pays_ligue", label: "Pays ligue", group: "Club & contrat" },
  { key: "stade", label: "Stade", group: "Club & contrat" },
  { key: "coach", label: "Entraîneur", group: "Club & contrat" },
  { key: "manager", label: "Manager / DS", group: "Club & contrat" },
  { key: "numero_maillot", label: "N° maillot", group: "Club & contrat" },
  { key: "contrat_fin", label: "Fin de contrat", group: "Club & contrat" },
  { key: "salaire", label: "Salaire annuel", fmt: v => `${v} M€`, group: "Club & contrat" },
  { key: "salaire_semaine", label: "Salaire / semaine", fmt: v => `${v} k€`, group: "Club & contrat" },
  { key: "agent", label: "Agent", group: "Club & contrat" },
  { key: "agence", label: "Agence", group: "Club & contrat" },
  { key: "valeur_marchande", label: "Valeur marchande", fmt: v => `${v} M€`, group: "Club & contrat" },
  { key: "valeur_marchande_peak", label: "Valeur max (carrière)", fmt: v => `${v} M€`, group: "Club & contrat" },
  { key: "transfermarkt_id", label: "ID Transfermarkt", group: "Club & contrat" },
  { key: "sofascore_id", label: "ID SofaScore", group: "Club & contrat" },
  // Stats saison
  { key: "matchs_joues", label: "Matchs joués", group: "Stats saison" },
  { key: "titularisations", label: "Titularisations", group: "Stats saison" },
  { key: "minutes_jouees", label: "Minutes jouées", group: "Stats saison" },
  { key: "buts", label: "Buts", group: "Stats saison" },
  { key: "passes_decisives", label: "Passes déc.", group: "Stats saison" },
  { key: "buts_passes", label: "Buts + Passes", group: "Stats saison" },
  { key: "cartons_jaunes", label: "Cartons jaunes", group: "Stats saison" },
  { key: "cartons_rouges", label: "Cartons rouges", group: "Stats saison" },
  { key: "note_moyenne", label: "Note SofaScore", group: "Stats saison" },
  // Stats avancées
  { key: "xg", label: "xG", group: "Stats avancées" },
  { key: "xa", label: "xA", group: "Stats avancées" },
  { key: "xg_par_90", label: "xG/90", group: "Stats avancées" },
  { key: "tirs", label: "Tirs", group: "Stats avancées" },
  { key: "tirs_cadres", label: "Tirs cadrés", group: "Stats avancées" },
  { key: "tirs_cadres_pct", label: "% tirs cadrés", fmt: v => `${v}%`, group: "Stats avancées" },
  { key: "grandes_chances", label: "Grandes chances créées", group: "Stats avancées" },
  { key: "grandes_chances_manquees", label: "Grandes chances manquées", group: "Stats avancées" },
  { key: "passes_reussies", label: "Passes réussies", group: "Stats avancées" },
  { key: "passes_reussies_pct", label: "% passes réussies", fmt: v => `${v}%`, group: "Stats avancées" },
  { key: "passes_cles", label: "Passes clés/match", group: "Stats avancées" },
  { key: "dribbles_reussis", label: "Dribbles réussis", group: "Stats avancées" },
  { key: "dribbles_pct", label: "% dribbles réussis", fmt: v => `${v}%`, group: "Stats avancées" },
  { key: "duels_gagnes_pct", label: "% duels gagnés", fmt: v => `${v}%`, group: "Stats avancées" },
  { key: "duels_aeriens_pct", label: "% duels aériens", fmt: v => `${v}%`, group: "Stats avancées" },
  { key: "interceptions", label: "Interceptions", group: "Stats avancées" },
  { key: "tacles", label: "Tacles réussis", group: "Stats avancées" },
  { key: "fautes_commises", label: "Fautes commises", group: "Stats avancées" },
  { key: "fautes_subies", label: "Fautes subies", group: "Stats avancées" },
  { key: "hors_jeu", label: "Hors-jeu", group: "Stats avancées" },
  { key: "distance_course", label: "Distance course (km/match)", group: "Stats avancées" },
  { key: "vitesse_max", label: "Vitesse max (km/h)", group: "Stats avancées" },
  { key: "touches_balle", label: "Touches/match", group: "Stats avancées" },
  { key: "pertes_balle", label: "Pertes de balle/match", group: "Stats avancées" },
  { key: "centres", label: "Centres", group: "Stats avancées" },
  { key: "penaltys_marques", label: "Penaltys marqués", group: "Stats avancées" },
  { key: "buts_tete", label: "Buts de la tête", group: "Stats avancées" },
  { key: "buts_pied_droit", label: "Buts pied droit", group: "Stats avancées" },
  { key: "buts_pied_gauche", label: "Buts pied gauche", group: "Stats avancées" },
  // Gardien
  { key: "arrets", label: "Arrêts (GK)", group: "Gardien" },
  { key: "arrets_pct", label: "% arrêts (GK)", fmt: v => `${v}%`, group: "Gardien" },
  { key: "clean_sheets", label: "Clean sheets (GK)", group: "Gardien" },
  { key: "buts_encaisses", label: "Buts encaissés (GK)", group: "Gardien" },
  { key: "xg_contre", label: "xG encaissés (GK)", group: "Gardien" },
  // Blessures
  { key: "blessures", label: "Blessures (carrière)", group: "Blessures & santé" },
  { key: "jours_blesses", label: "Jours sur blessure", group: "Blessures & santé" },
  { key: "type_blessures", label: "Types de blessures", group: "Blessures & santé" },
  // Carrière
  { key: "matchs_carriere", label: "Matchs (carrière)", group: "Carrière" },
  { key: "buts_carriere", label: "Buts (carrière)", group: "Carrière" },
  { key: "passes_carriere", label: "Passes (carrière)", group: "Carrière" },
  { key: "nb_clubs", label: "Clubs différents", group: "Carrière" },
  { key: "saisons_pro", label: "Saisons pro", group: "Carrière" },
  // International
  { key: "matchs_international", label: "Sélections nat.", group: "International" },
  { key: "buts_international", label: "Buts en sélection", group: "International" },
  { key: "passes_international", label: "Passes en sélection", group: "International" },
  { key: "premier_match_selection", label: "1er match sélection", group: "International" },
  // Profil
  { key: "palmares", label: "Palmarès", group: "Profil" },
  { key: "distinctions", label: "Distinctions individuelles", group: "Profil" },
  { key: "style_jeu", label: "Style de jeu", group: "Profil" },
  { key: "forces", label: "Points forts", group: "Profil" },
  { key: "faiblesses", label: "Points faibles", group: "Profil" },
  { key: "stats_resume", label: "Résumé carrière", group: "Profil" },
  { key: "note_globale_scout", label: "Note scout (0-100)", group: "Profil" },
];

const JSON_SCHEMA = {
  type: "object",
  properties: {
    nom: { type: "string" }, age: { type: "number" }, date_naissance: { type: "string" },
    lieu_naissance: { type: "string" }, nationalite: { type: "string" }, nationalite_secondaire: { type: "string" },
    poste: { type: "string" }, poste_secondaire: { type: "string" }, pied_fort: { type: "string" },
    taille: { type: "number" }, poids: { type: "number" },
    club_actuel: { type: "string" }, ligue: { type: "string" }, pays_ligue: { type: "string" },
    stade: { type: "string" }, coach: { type: "string" }, manager: { type: "string" },
    numero_maillot: { type: "number" }, contrat_fin: { type: "string" },
    salaire: { type: "number" }, salaire_semaine: { type: "number" },
    agent: { type: "string" }, agence: { type: "string" },
    valeur_marchande: { type: "number" }, valeur_marchande_peak: { type: "number" },
    transfermarkt_id: { type: "string" }, sofascore_id: { type: "string" },
    matchs_joues: { type: "number" }, titularisations: { type: "number" }, minutes_jouees: { type: "number" },
    buts: { type: "number" }, passes_decisives: { type: "number" }, buts_passes: { type: "number" },
    cartons_jaunes: { type: "number" }, cartons_rouges: { type: "number" }, note_moyenne: { type: "number" },
    xg: { type: "number" }, xa: { type: "number" }, xg_par_90: { type: "number" },
    tirs: { type: "number" }, tirs_cadres: { type: "number" }, tirs_cadres_pct: { type: "number" },
    grandes_chances: { type: "number" }, grandes_chances_manquees: { type: "number" },
    passes_reussies: { type: "number" }, passes_reussies_pct: { type: "number" },
    passes_cles: { type: "number" }, dribbles_reussis: { type: "number" }, dribbles_pct: { type: "number" },
    duels_gagnes_pct: { type: "number" }, duels_aeriens_pct: { type: "number" },
    interceptions: { type: "number" }, tacles: { type: "number" }, fautes_commises: { type: "number" },
    fautes_subies: { type: "number" }, hors_jeu: { type: "number" },
    distance_course: { type: "number" }, vitesse_max: { type: "number" },
    touches_balle: { type: "number" }, pertes_balle: { type: "number" },
    centres: { type: "number" }, penaltys_marques: { type: "number" },
    buts_tete: { type: "number" }, buts_pied_droit: { type: "number" }, buts_pied_gauche: { type: "number" },
    arrets: { type: "number" }, arrets_pct: { type: "number" }, clean_sheets: { type: "number" },
    buts_encaisses: { type: "number" }, xg_contre: { type: "number" },
    blessures: { type: "number" }, jours_blesses: { type: "number" }, type_blessures: { type: "string" },
    matchs_carriere: { type: "number" }, buts_carriere: { type: "number" },
    passes_carriere: { type: "number" }, nb_clubs: { type: "number" }, saisons_pro: { type: "number" },
    matchs_international: { type: "number" }, buts_international: { type: "number" },
    passes_international: { type: "number" }, premier_match_selection: { type: "string" },
    palmares: { type: "string" }, distinctions: { type: "string" },
    style_jeu: { type: "string" }, forces: { type: "string" }, faiblesses: { type: "string" },
    stats_resume: { type: "string" }, note_globale_scout: { type: "number" },
  }
};

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
      prompt: `Tu es un scout de football expert. Recherche TOUTES les informations disponibles sur le joueur "${player.nom}"${player.club_actuel ? ` (${player.club_actuel})` : ""}${player.nationalite ? `, nationalité ${player.nationalite}` : ""}.

Sources : Transfermarkt.fr, SofaScore, FIFA, Wikipedia, L'Équipe, Foot Mercato, presse officielle des clubs.

RÈGLES DE FORMAT STRICTES :
- valeur_marchande, valeur_marchande_peak, salaire : en millions € (ex: 80.5)
- salaire_semaine : en milliers € par semaine (ex: 250)
- taille : en cm (ex: 181), poids : en kg (ex: 73)
- age : entier, dates au format YYYY-MM-DD
- pied_fort : "Droit", "Gauche" ou "Les deux" UNIQUEMENT
- poste / poste_secondaire : parmi : Gardien, Défenseur central, Latéral droit, Latéral gauche, Milieu défensif, Milieu central, Milieu offensif, Ailier droit, Ailier gauche, Attaquant
- xg, xa, xg_par_90 : statistiques Expected Goals / Expected Assists (décimaux)
- tirs_cadres_pct, passes_reussies_pct, arrets_pct, dribbles_pct, duels_gagnes_pct, duels_aeriens_pct : en pourcentage sans le symbole %
- note_moyenne : note SofaScore (décimal ex: 7.42), note_globale_scout : sur 100
- titularisations, minutes_jouees : pour la saison en cours
- blessures : nombre total de blessures distinctes en carrière ; jours_blesses : total jours d'absence sur blessure
- saisons_pro : nombre de saisons en tant que professionnel
- premier_match_selection : date du premier match en équipe nationale (YYYY-MM-DD)
- distinctions : récompenses individuelles (Ballon d'Or, Soulier d'Or, TOTY, Joueur du mois, etc.)
- style_jeu : description du style de jeu en 2-3 phrases
- forces / faiblesses : liste séparée par virgules
- stats_resume : résumé complet de la carrière en 3-4 phrases
- Si une info est inconnue, mets null (ne génère PAS de valeur inventée)
- transfermarkt_id : uniquement le numéro (ex: 342229), sofascore_id : uniquement le numéro`,
      add_context_from_internet: true,
      response_json_schema: JSON_SCHEMA
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
        <span className="text-xs text-slate-500 flex-shrink-0 w-40">{label}</span>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {changed && oldVal !== undefined && oldVal !== null && oldVal !== "" && (
            <span className="text-[10px] text-slate-400 line-through">{fmt ? fmt(oldVal) : String(oldVal)}</span>
          )}
          <span className={`text-xs font-semibold ${changed ? "text-green-700" : "text-slate-700"} text-right`}>
            {fmt ? fmt(newVal) : String(newVal)}
          </span>
          {changed && <Badge className="bg-green-100 text-green-700 text-[10px] px-1 py-0 leading-tight border-0">Nouveau</Badge>}
        </div>
      </div>
    );
  };

  // Group fields for display
  const groupedChanged = changedFields.reduce((acc, f) => {
    acc[f.group] = acc[f.group] || [];
    acc[f.group].push(f);
    return acc;
  }, {});

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-purple-800">
          <Sparkles className="w-4 h-4" />
          Enrichir avec l'IA
          <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px]">
            {ALL_FIELDS.length} champs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">

        {!result && !applied && (
          <>
            <p className="text-xs text-slate-500">
              Recherche complète sur <strong>Transfermarkt</strong> & <strong>SofaScore</strong> : stats avancées (xG, xA, dribbles, duels…), données physiques, blessures, carrière internationale, palmarès, distinctions, profil scout…
            </p>
            <Button onClick={handleEnrich} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="sm">
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Recherche en cours… (peut prendre 20-30 s)</>
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
            <Button onClick={() => setApplied(false)} size="sm" variant="outline" className="w-full text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Relancer une recherche
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            {changedFields.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 mb-2">
                  ✅ {changedFields.length} champ{changedFields.length > 1 ? "s" : ""} à mettre à jour
                </p>
                {Object.entries(groupedChanged).map(([group, fields]) => (
                  <div key={group} className="mb-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{group}</div>
                    <div className="bg-white rounded-lg border border-slate-200 px-2 py-1">
                      {fields.map(f => <DiffRow key={f.key} fieldDef={f} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}

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