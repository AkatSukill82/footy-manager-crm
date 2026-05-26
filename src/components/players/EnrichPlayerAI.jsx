import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const ALL_FIELDS = [
  { key: "nom", label: "Nom complet" },
  { key: "age", label: "Âge", fmt: v => `${v} ans` },
  { key: "date_naissance", label: "Date de naissance" },
  { key: "lieu_naissance", label: "Lieu de naissance" },
  { key: "nationalite", label: "Nationalité" },
  { key: "nationalite_secondaire", label: "2ème nationalité" },
  { key: "poste", label: "Poste principal" },
  { key: "poste_secondaire", label: "Poste secondaire" },
  { key: "pied_fort", label: "Pied fort" },
  { key: "taille", label: "Taille", fmt: v => `${v} cm` },
  { key: "poids", label: "Poids", fmt: v => `${v} kg` },
  { key: "club_actuel", label: "Club actuel" },
  { key: "ligue", label: "Ligue" },
  { key: "pays_ligue", label: "Pays de la ligue" },
  { key: "stade", label: "Stade" },
  { key: "numero_maillot", label: "N° maillot" },
  { key: "contrat_fin", label: "Fin de contrat" },
  { key: "salaire", label: "Salaire annuel", fmt: v => `${v} M€` },
  { key: "salaire_semaine", label: "Salaire hebdo", fmt: v => `${v} k€` },
  { key: "coach", label: "Entraîneur" },
  { key: "manager", label: "Directeur sportif" },
  { key: "agent", label: "Agent" },
  { key: "agence", label: "Agence" },
  { key: "valeur_marchande", label: "Valeur marchande", fmt: v => `${v} M€` },
  { key: "valeur_marchande_peak", label: "Valeur max carrière", fmt: v => `${v} M€` },
  { key: "photo_url", label: "Photo" },
  { key: "transfermarkt_id", label: "ID Transfermarkt" },
  { key: "sofascore_id", label: "ID SofaScore" },
  { key: "matchs_joues", label: "Matchs joués" },
  { key: "titularisations", label: "Titularisations" },
  { key: "minutes_jouees", label: "Minutes jouées" },
  { key: "buts", label: "Buts" },
  { key: "passes_decisives", label: "Passes déc." },
  { key: "buts_passes", label: "Buts + Passes" },
  { key: "cartons_jaunes", label: "Cartons jaunes" },
  { key: "cartons_rouges", label: "Cartons rouges" },
  { key: "note_moyenne", label: "Note SofaScore" },
  { key: "xg", label: "xG" },
  { key: "xa", label: "xA" },
  { key: "xg_par_90", label: "xG/90min" },
  { key: "tirs", label: "Tirs tentés" },
  { key: "tirs_cadres", label: "Tirs cadrés" },
  { key: "tirs_cadres_pct", label: "% tirs cadrés", fmt: v => `${v}%` },
  { key: "grandes_chances", label: "Grandes chances créées" },
  { key: "grandes_chances_manquees", label: "Grandes chances manquées" },
  { key: "penaltys_marques", label: "Penaltys marqués" },
  { key: "penaltys_tires", label: "Penaltys tirés" },
  { key: "penaltys_provoques", label: "Penaltys provoqués" },
  { key: "buts_tete", label: "Buts de la tête" },
  { key: "buts_pied_gauche", label: "Buts pied gauche" },
  { key: "buts_pied_droit", label: "Buts pied droit" },
  { key: "passes_reussies", label: "Passes réussies" },
  { key: "passes_reussies_pct", label: "% passes réussies", fmt: v => `${v}%` },
  { key: "passes_longues_pct", label: "% passes longues", fmt: v => `${v}%` },
  { key: "passes_cles", label: "Passes clés/match" },
  { key: "centres", label: "Centres tentés" },
  { key: "centres_reussis_pct", label: "% centres réussis", fmt: v => `${v}%` },
  { key: "dribbles_reussis", label: "Dribbles réussis" },
  { key: "dribbles_tentes", label: "Dribbles tentés" },
  { key: "dribbles_pct", label: "% dribbles", fmt: v => `${v}%` },
  { key: "touches_balle", label: "Touches/match" },
  { key: "pertes_balle", label: "Pertes de balle/match" },
  { key: "distance_course", label: "Distance course km/match" },
  { key: "sprints", label: "Sprints/match" },
  { key: "vitesse_max", label: "Vitesse max", fmt: v => `${v} km/h` },
  { key: "interceptions", label: "Interceptions" },
  { key: "tacles", label: "Tacles réussis" },
  { key: "tacles_reussis_pct", label: "% tacles réussis", fmt: v => `${v}%` },
  { key: "degagements", label: "Dégagements" },
  { key: "duels_gagnes_pct", label: "% duels gagnés", fmt: v => `${v}%` },
  { key: "duels_aeriens_pct", label: "% duels aériens", fmt: v => `${v}%` },
  { key: "recuperations", label: "Récupérations" },
  { key: "fautes_commises", label: "Fautes commises" },
  { key: "fautes_subies", label: "Fautes subies" },
  { key: "hors_jeu", label: "Hors-jeu" },
  { key: "corners_provoquees", label: "Corners provoqués" },
  { key: "arrets", label: "Arrêts (GK)" },
  { key: "arrets_pct", label: "% arrêts (GK)", fmt: v => `${v}%` },
  { key: "buts_encaisses", label: "Buts encaissés (GK)" },
  { key: "clean_sheets", label: "Clean sheets (GK)" },
  { key: "sorties_reussies", label: "Sorties réussies (GK)" },
  { key: "xg_contre", label: "xG encaissés (GK)" },
  { key: "blessures", label: "Blessures (carrière)" },
  { key: "jours_blesses", label: "Jours manqués sur blessure" },
  { key: "type_blessures", label: "Types de blessures" },
  { key: "matchs_carriere", label: "Matchs (carrière club)" },
  { key: "buts_carriere", label: "Buts (carrière club)" },
  { key: "passes_carriere", label: "Passes déc. (carrière club)" },
  { key: "nb_clubs", label: "Clubs différents" },
  { key: "saisons_pro", label: "Saisons pro" },
  { key: "matchs_international", label: "Sélections nat." },
  { key: "buts_international", label: "Buts en sélection" },
  { key: "passes_international", label: "Passes déc. sélection" },
  { key: "premier_match_selection", label: "1er match sélection" },
  { key: "selection_u21", label: "U21 national", fmt: v => v ? "Oui" : "Non" },
  { key: "palmares", label: "Palmarès" },
  { key: "distinctions", label: "Distinctions individuelles" },
  { key: "style_jeu", label: "Style de jeu" },
  { key: "forces", label: "Points forts" },
  { key: "faiblesses", label: "Points faibles" },
  { key: "note_globale_scout", label: "Note scout (0-100)" },
  { key: "stats_resume", label: "Résumé carrière" },
];

export default function EnrichPlayerAI({ player, onApply }) {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [applied, setApplied] = useState(false);
  const [showUnchanged, setShowUnchanged] = useState(false);

  const handleEnrich = async () => {
    setLoading(true);
    setResult(null);
    setApplied(false);

    const data = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert en données football. Recherche TOUTES les informations disponibles sur le joueur "${player.nom}"${player.club_actuel ? ` évoluant à ${player.club_actuel}` : ""}${player.nationalite ? `, nationalité ${player.nationalite}` : ""}.

Consulte impérativement :
- Transfermarkt.fr (profil, valeur marchande, contrat, historique clubs, agent, historique valeurs)
- SofaScore (stats saison en cours, notes, stats avancées xG/xA, physique, duels)
- Wikipedia / presse sportive (biographie, palmarès, distinctions)
- TheSportsDB ou tout site officiel pour trouver une URL de photo du joueur

Retourne UN JSON COMPLET avec TOUTES les données disponibles. Si une donnée est inconnue, mets null.

RÈGLES DE FORMAT STRICTES :
- valeur_marchande, valeur_marchande_peak, salaire : en millions € (ex: 85.0)
- salaire_semaine : en milliers € par semaine (ex: 250.0)
- taille : cm entier (ex: 181), poids : kg entier (ex: 73)
- age : entier, toutes les dates : YYYY-MM-DD
- pied_fort : exactement "Droit", "Gauche" ou "Les deux"
- poste / poste_secondaire : parmi exactement : Gardien, Défenseur central, Latéral droit, Latéral gauche, Milieu défensif, Milieu central, Milieu offensif, Ailier droit, Ailier gauche, Attaquant
- note_moyenne : note SofaScore décimale (ex: 7.42)
- xg, xa, xg_par_90 : décimaux (ex: 14.3)
- tous les pourcentages (pct) : nombre entre 0 et 100 (ex: 87.5)
- tirs_cadres_pct, passes_reussies_pct, etc. : entre 0 et 100
- photo_url : URL directe et publique vers une photo du joueur (Transfermarkt, site officiel, TheSportsDB, Wikipedia…)
- transfermarkt_id : uniquement le numéro (ex: 342229)
- palmares : tous titres séparés par des virgules
- distinctions : récompenses individuelles séparées par virgules (Ballon d'or, TOTY, meilleur joueur, etc.)
- style_jeu, forces, faiblesses, stats_resume : texte en français
- selection_u21 : true ou false
- saisons_pro : nombre de saisons professionnelles
- vitesse_max : en km/h (ex: 36.5)
- distance_course : km par match (ex: 11.2)`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          nom: { type: "string" }, age: { type: "number" }, date_naissance: { type: "string" },
          lieu_naissance: { type: "string" }, nationalite: { type: "string" },
          nationalite_secondaire: { type: "string" }, poste: { type: "string" },
          poste_secondaire: { type: "string" }, pied_fort: { type: "string" },
          taille: { type: "number" }, poids: { type: "number" }, club_actuel: { type: "string" },
          ligue: { type: "string" }, pays_ligue: { type: "string" }, stade: { type: "string" },
          numero_maillot: { type: "number" }, contrat_fin: { type: "string" },
          salaire: { type: "number" }, salaire_semaine: { type: "number" },
          coach: { type: "string" }, manager: { type: "string" }, agent: { type: "string" },
          agence: { type: "string" }, valeur_marchande: { type: "number" },
          valeur_marchande_peak: { type: "number" }, transfermarkt_id: { type: "string" },
          sofascore_id: { type: "string" }, photo_url: { type: "string" },
          matchs_joues: { type: "number" }, titularisations: { type: "number" },
          minutes_jouees: { type: "number" }, buts: { type: "number" },
          passes_decisives: { type: "number" }, buts_passes: { type: "number" },
          cartons_jaunes: { type: "number" }, cartons_rouges: { type: "number" },
          note_moyenne: { type: "number" }, xg: { type: "number" }, xa: { type: "number" },
          xg_par_90: { type: "number" }, tirs: { type: "number" }, tirs_cadres: { type: "number" },
          tirs_cadres_pct: { type: "number" }, grandes_chances: { type: "number" },
          grandes_chances_manquees: { type: "number" }, penaltys_marques: { type: "number" },
          penaltys_tires: { type: "number" }, penaltys_provoques: { type: "number" },
          buts_tete: { type: "number" }, buts_pied_gauche: { type: "number" },
          buts_pied_droit: { type: "number" }, passes_reussies: { type: "number" },
          passes_reussies_pct: { type: "number" }, passes_longues_pct: { type: "number" },
          passes_cles: { type: "number" }, centres: { type: "number" },
          centres_reussis_pct: { type: "number" }, dribbles_reussis: { type: "number" },
          dribbles_tentes: { type: "number" }, dribbles_pct: { type: "number" },
          touches_balle: { type: "number" }, pertes_balle: { type: "number" },
          distance_course: { type: "number" }, sprints: { type: "number" },
          vitesse_max: { type: "number" }, interceptions: { type: "number" },
          tacles: { type: "number" }, tacles_reussis_pct: { type: "number" },
          degagements: { type: "number" }, duels_gagnes_pct: { type: "number" },
          duels_aeriens_pct: { type: "number" }, recuperations: { type: "number" },
          fautes_commises: { type: "number" }, fautes_subies: { type: "number" },
          hors_jeu: { type: "number" }, corners_provoquees: { type: "number" },
          arrets: { type: "number" }, arrets_pct: { type: "number" },
          buts_encaisses: { type: "number" }, clean_sheets: { type: "number" },
          sorties_reussies: { type: "number" }, xg_contre: { type: "number" },
          blessures: { type: "number" }, jours_blesses: { type: "number" },
          type_blessures: { type: "string" }, matchs_carriere: { type: "number" },
          buts_carriere: { type: "number" }, passes_carriere: { type: "number" },
          nb_clubs: { type: "number" }, saisons_pro: { type: "number" },
          matchs_international: { type: "number" }, buts_international: { type: "number" },
          passes_international: { type: "number" }, premier_match_selection: { type: "string" },
          selection_u21: { type: "boolean" }, palmares: { type: "string" },
          distinctions: { type: "string" }, style_jeu: { type: "string" },
          forces: { type: "string" }, faiblesses: { type: "string" },
          note_globale_scout: { type: "number" }, stats_resume: { type: "string" },
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
          <span className={`text-xs font-semibold ${changed ? "text-green-700" : "text-slate-700"} text-right max-w-[200px] break-words`}>
            {fmt ? fmt(newVal) : String(newVal)}
          </span>
          {changed && <Badge className="bg-green-100 text-green-700 text-[10px] px-1 py-0 leading-tight border-0">{t(lang, 'playerDetail.newBadge')}</Badge>}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-purple-800">
          <Sparkles className="w-4 h-4" />
          {t(lang, 'playerDetail.enrichTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">

        {!result && !applied && (
          <>
            <p className="text-xs text-slate-500">
              {t(lang, 'playerDetail.enrichDesc', { name: player.nom })}
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500">
              {[
                t(lang, 'playerDetail.catIdentity'),
                t(lang, 'playerDetail.catStats'),
                t(lang, 'playerDetail.catTrophies'),
                t(lang, 'playerDetail.catHealth'),
                t(lang, 'playerDetail.catNational'),
                t(lang, 'playerDetail.catTransfer'),
              ].map(cat => (
                <div key={cat} className="bg-white rounded-lg p-2 border border-slate-100">{cat}</div>
              ))}
            </div>
            <Button onClick={handleEnrich} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="sm">
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t(lang, 'playerDetail.searching')}</>
                : <><Sparkles className="w-4 h-4 mr-2" />{t(lang, 'playerDetail.searchAll')}</>}
            </Button>
          </>
        )}

        {loading && (
          <div className="space-y-2">
            {[t(lang, 'playerDetail.searchingTM'), t(lang, 'playerDetail.searchingSS'), t(lang, 'playerDetail.searchingPress')].map(s => (
              <div key={s} className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-3 h-3 animate-spin text-purple-500" />{s}
              </div>
            ))}
          </div>
        )}

        {applied && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">{t(lang, 'playerDetail.profileUpdated')}</span>
            </div>
            <Button onClick={() => setApplied(false)} size="sm" variant="outline" className="w-full text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {t(lang, 'playerDetail.relaunch')}
            </Button>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800 border-0">
                {t(lang, 'playerDetail.updates', { count: changedFields.length, s: changedFields.length > 1 ? "s" : "" })}
              </Badge>
              <Badge className="bg-slate-100 text-slate-600 border-0">
                {t(lang, 'playerDetail.alreadyUpToDate', { count: unchangedFields.length, s: unchangedFields.length > 1 ? "s" : "" })}
              </Badge>
              <Badge className="bg-purple-100 text-purple-700 border-0">
                {t(lang, 'playerDetail.totalFields', { count: changedFields.length + unchangedFields.length })}
              </Badge>
            </div>

            {changedFields.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 mb-2">{t(lang, 'playerDetail.toUpdate')}</p>
                <div className="bg-white rounded-lg border border-slate-200 px-2 py-1 max-h-80 overflow-y-auto">
                  {changedFields.map(f => <DiffRow key={f.key} fieldDef={f} />)}
                </div>
              </div>
            )}

            {unchangedFields.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowUnchanged(!showUnchanged)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showUnchanged ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {t(lang, 'playerDetail.alreadyUpToDate', { count: unchangedFields.length, s: unchangedFields.length > 1 ? "s" : "" })}
                </button>
                {showUnchanged && (
                  <div className="bg-slate-50 rounded-lg border border-slate-100 px-2 py-1 mt-1 max-h-48 overflow-y-auto">
                    {unchangedFields.map(f => <DiffRow key={f.key} fieldDef={f} />)}
                  </div>
                )}
              </div>
            )}

            {changedFields.length === 0 && unchangedFields.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-2">{t(lang, 'playerDetail.noDataAI')}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleApply}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={changedFields.length === 0 && unchangedFields.length === 0}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {t(lang, 'playerDetail.applyAll', { count: changedFields.length + unchangedFields.length })}
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
