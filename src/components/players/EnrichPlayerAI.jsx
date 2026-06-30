import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
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

// Libellés traduits (le FR par défaut vient de ALL_FIELDS.label).
const EN_LABELS = {
  nom: "Full name", age: "Age", date_naissance: "Date of birth", lieu_naissance: "Place of birth", nationalite: "Nationality", nationalite_secondaire: "2nd nationality", poste: "Main position", poste_secondaire: "Secondary position", pied_fort: "Strong foot", taille: "Height", poids: "Weight", club_actuel: "Current club", ligue: "League", pays_ligue: "League country", stade: "Stadium", numero_maillot: "Shirt no.", contrat_fin: "Contract end", salaire: "Annual salary", salaire_semaine: "Weekly salary", coach: "Coach", manager: "Sporting director", agent: "Agent", agence: "Agency", valeur_marchande: "Market value", valeur_marchande_peak: "Peak career value", photo_url: "Photo", transfermarkt_id: "Transfermarkt ID", sofascore_id: "SofaScore ID", matchs_joues: "Apps", titularisations: "Starts", minutes_jouees: "Minutes played", buts: "Goals", passes_decisives: "Assists", buts_passes: "Goals + Assists", cartons_jaunes: "Yellow cards", cartons_rouges: "Red cards", note_moyenne: "SofaScore rating", xg: "xG", xa: "xA", xg_par_90: "xG/90min", tirs: "Shots taken", tirs_cadres: "Shots on target", tirs_cadres_pct: "% on target", grandes_chances: "Big chances created", grandes_chances_manquees: "Big chances missed", penaltys_marques: "Penalties scored", penaltys_tires: "Penalties taken", penaltys_provoques: "Penalties won", buts_tete: "Headed goals", buts_pied_gauche: "Left-foot goals", buts_pied_droit: "Right-foot goals", passes_reussies: "Accurate passes", passes_reussies_pct: "% passes accurate", passes_longues_pct: "% long passes", passes_cles: "Key passes/match", centres: "Crosses attempted", centres_reussis_pct: "% crosses accurate", dribbles_reussis: "Successful dribbles", dribbles_tentes: "Dribbles attempted", dribbles_pct: "% dribbles", touches_balle: "Touches/match", pertes_balle: "Possession lost/match", distance_course: "Distance km/match", sprints: "Sprints/match", vitesse_max: "Top speed", interceptions: "Interceptions", tacles: "Successful tackles", tacles_reussis_pct: "% tackles won", degagements: "Clearances", duels_gagnes_pct: "% duels won", duels_aeriens_pct: "% aerial duels", recuperations: "Recoveries", fautes_commises: "Fouls committed", fautes_subies: "Fouls won", hors_jeu: "Offsides", corners_provoquees: "Corners won", arrets: "Saves (GK)", arrets_pct: "% saves (GK)", buts_encaisses: "Goals conceded (GK)", clean_sheets: "Clean sheets (GK)", sorties_reussies: "Successful claims (GK)", xg_contre: "xG conceded (GK)", blessures: "Injuries (career)", jours_blesses: "Days out injured", type_blessures: "Injury types", matchs_carriere: "Apps (club career)", buts_carriere: "Goals (club career)", passes_carriere: "Assists (club career)", nb_clubs: "Different clubs", saisons_pro: "Pro seasons", matchs_international: "Nat. caps", buts_international: "Int'l goals", passes_international: "Int'l assists", premier_match_selection: "First cap", selection_u21: "National U21", palmares: "Honours", distinctions: "Individual awards", style_jeu: "Playing style", forces: "Strengths", faiblesses: "Weaknesses", note_globale_scout: "Scout rating (0-100)", stats_resume: "Career summary",
};
const ES_LABELS = {
  nom: "Nombre completo", age: "Edad", date_naissance: "Fecha de nacimiento", lieu_naissance: "Lugar de nacimiento", nationalite: "Nacionalidad", nationalite_secondaire: "2ª nacionalidad", poste: "Posición principal", poste_secondaire: "Posición secundaria", pied_fort: "Pie hábil", taille: "Altura", poids: "Peso", club_actuel: "Club actual", ligue: "Liga", pays_ligue: "País de la liga", stade: "Estadio", numero_maillot: "Dorsal", contrat_fin: "Fin de contrato", salaire: "Salario anual", salaire_semaine: "Salario semanal", coach: "Entrenador", manager: "Director deportivo", agent: "Agente", agence: "Agencia", valeur_marchande: "Valor de mercado", valeur_marchande_peak: "Valor máx. carrera", photo_url: "Foto", transfermarkt_id: "ID Transfermarkt", sofascore_id: "ID SofaScore", matchs_joues: "Partidos", titularisations: "Titularidades", minutes_jouees: "Minutos jugados", buts: "Goles", passes_decisives: "Asistencias", buts_passes: "Goles + Asistencias", cartons_jaunes: "Tarjetas amarillas", cartons_rouges: "Tarjetas rojas", note_moyenne: "Nota SofaScore", xg: "xG", xa: "xA", xg_par_90: "xG/90min", tirs: "Tiros intentados", tirs_cadres: "Tiros a puerta", tirs_cadres_pct: "% a puerta", grandes_chances: "Ocasiones claras creadas", grandes_chances_manquees: "Ocasiones claras falladas", penaltys_marques: "Penaltis marcados", penaltys_tires: "Penaltis lanzados", penaltys_provoques: "Penaltis provocados", buts_tete: "Goles de cabeza", buts_pied_gauche: "Goles pie izquierdo", buts_pied_droit: "Goles pie derecho", passes_reussies: "Pases completados", passes_reussies_pct: "% pases completados", passes_longues_pct: "% pases largos", passes_cles: "Pases clave/partido", centres: "Centros intentados", centres_reussis_pct: "% centros completados", dribbles_reussis: "Regates completados", dribbles_tentes: "Regates intentados", dribbles_pct: "% regates", touches_balle: "Toques/partido", pertes_balle: "Pérdidas/partido", distance_course: "Distancia km/partido", sprints: "Sprints/partido", vitesse_max: "Velocidad máx", interceptions: "Intercepciones", tacles: "Entradas completadas", tacles_reussis_pct: "% entradas ganadas", degagements: "Despejes", duels_gagnes_pct: "% duelos ganados", duels_aeriens_pct: "% duelos aéreos", recuperations: "Recuperaciones", fautes_commises: "Faltas cometidas", fautes_subies: "Faltas recibidas", hors_jeu: "Fueras de juego", corners_provoquees: "Córneres provocados", arrets: "Paradas (PT)", arrets_pct: "% paradas (PT)", buts_encaisses: "Goles encajados (PT)", clean_sheets: "Porterías a cero (PT)", sorties_reussies: "Salidas completadas (PT)", xg_contre: "xG en contra (PT)", blessures: "Lesiones (carrera)", jours_blesses: "Días de baja", type_blessures: "Tipos de lesiones", matchs_carriere: "Partidos (carrera club)", buts_carriere: "Goles (carrera club)", passes_carriere: "Asistencias (carrera club)", nb_clubs: "Clubes diferentes", saisons_pro: "Temporadas pro", matchs_international: "Internacionalidades", buts_international: "Goles internacionales", passes_international: "Asist. internacionales", premier_match_selection: "Primer partido sel.", selection_u21: "Sub-21 nacional", palmares: "Palmarés", distinctions: "Distinciones individuales", style_jeu: "Estilo de juego", forces: "Puntos fuertes", faiblesses: "Puntos débiles", note_globale_scout: "Nota scout (0-100)", stats_resume: "Resumen de carrera",
};
const labelFor = (key, fallback, lang) => (lang === "en" ? EN_LABELS : lang === "es" ? ES_LABELS : null)?.[key] || fallback;

export default function EnrichPlayerAI({ player, onApply }) {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [applied, setApplied] = useState(false);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [enrichError, setEnrichError] = useState(null);

  const handleEnrich = async () => {
    setLoading(true);
    setResult(null);
    setApplied(false);
    setEnrichError(null);

    const playerCtx = [
      `Nom: ${player.nom}`,
      player.club_actuel && `Club actuel: ${player.club_actuel}`,
      player.nationalite && `Nationalité: ${player.nationalite}`,
      player.date_naissance && `Date de naissance: ${player.date_naissance}`,
      player.age && `Âge: ${player.age} ans`,
      player.poste && `Poste: ${player.poste}`,
      player.transfermarkt_id && `Transfermarkt ID: ${player.transfermarkt_id}`,
      player.ligue && `Ligue: ${player.ligue}`,
      player.lieu_naissance && `Lieu de naissance: ${player.lieu_naissance}`,
    ].filter(Boolean).join("\n");

    const FORMAT_RULES = `
RÈGLES DE FORMAT STRICTES :
- valeur_marchande, valeur_marchande_peak, salaire : en millions € (ex: 0.45 pour 450K€, 85.0 pour 85M€)
- salaire_semaine : en milliers € par semaine
- taille : cm entier, poids : kg entier
- age : entier, toutes les dates : YYYY-MM-DD
- pied_fort : exactement "Droit", "Gauche" ou "Les deux"
- poste / poste_secondaire : parmi exactement : Gardien, Défenseur central, Latéral droit, Latéral gauche, Milieu défensif, Milieu central, Milieu offensif, Ailier droit, Ailier gauche, Attaquant
- tous les pourcentages (pct) : nombre entre 0 et 100
- transfermarkt_id : uniquement le numéro (ex: 342229)
- Si une donnée est inconnue, mets null`;

    const jsonSchema = {
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
    };

    try {
      // Lancer 2 requêtes en parallèle : une pour l'identité/carrière, une pour les stats/matchs
      const [data1, data2] = await Promise.all([
        base44.integrations.Core.InvokeLLM({
          prompt: `Tu es un scout football expert. Recherche TOUTES les infos disponibles sur ce joueur en consultant OBLIGATOIREMENT dans cet ordre :

1. **Transfermarkt** (transfermarkt.com et transfermarkt.fr) : profil complet, valeur marchande actuelle et historique, contrat, agent, club actuel, situation de prêt, historique de tous les clubs, blessures passées, matchs et buts en carrière, transfermarkt_id
2. **Wikipedia** (en français, anglais et dans la langue du pays du joueur) : biographie, lieu de naissance exact, palmarès, distinctions, anecdotes carrière
3. **Site officiel du club** actuel : numéro de maillot, entraîneur, stade
4. **Google Images / Transfermarkt** : trouver une URL de photo publique directement accessible

INFORMATIONS CONNUES SUR LE JOUEUR :
${playerCtx}

FOCUS DE CETTE REQUÊTE : identité, biographie, contrat, valeur marchande, agent, historique clubs, blessures, carrière complète, palmarès, photo.
${FORMAT_RULES}`,
          add_context_from_internet: true,
          model: "gemini_3_1_pro",
          response_json_schema: jsonSchema,
        }),

        base44.integrations.Core.InvokeLLM({
          prompt: `Tu es un analyste football expert. Recherche TOUTES les statistiques disponibles sur ce joueur en consultant OBLIGATOIREMENT :

1. **SofaScore** (sofascore.com) : stats saison en cours (buts, passes déc., note moyenne, xG, xA, tirs, dribbles, duels, interceptions, passes %, distance course, sprints, vitesse max, touches balle), sofascore_id
2. **FotMob** (fotmob.com) : titularisations, stats par match, note, forme récente
3. **BeSoccer** (besoccer.com) : stats saison, valeur marchande, ELO, contrat
4. **Soccerway** : historique complet matchs et buts saison par saison
5. **Sélection nationale** : caps, buts, derniers matchs en équipe nationale

INFORMATIONS CONNUES SUR LE JOUEUR :
${playerCtx}

FOCUS DE CETTE REQUÊTE : statistiques saison en cours, stats avancées (xG/xA/duels/physique), sélection nationale, style de jeu détaillé, points forts et faibles basés sur les stats.
${FORMAT_RULES}`,
          add_context_from_internet: true,
          model: "gemini_3_1_pro",
          response_json_schema: jsonSchema,
        }),
      ]);

      // Fusionner les deux résultats : data1 prioritaire sauf si null/undefined
      const merged = { ...data2 };
      if (data1) {
        for (const key of Object.keys(data1)) {
          if (data1[key] !== null && data1[key] !== undefined && data1[key] !== "") {
            merged[key] = data1[key];
          }
        }
      }

      setResult(merged);
    } catch (err) {
      setEnrichError(err.message || "L'enrichissement IA a échoué. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
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
        <span className="text-xs text-slate-500 flex-shrink-0 w-40">{labelFor(key, label, lang)}</span>
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
            {enrichError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{enrichError}</span>
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="space-y-2 pt-1">
            {[
              "🔍 Transfermarkt — valeur, contrat, agent, historique clubs...",
              "📖 Wikipedia — biographie, palmarès, distinctions...",
              "📊 SofaScore / FotMob — stats saison, xG, xA, duels...",
              "⚡ BeSoccer — valeur marchande, ELO, forme actuelle...",
              "🌍 Sélection nationale — caps, buts internationaux...",
            ].map(s => (
              <div key={s} className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-3 h-3 animate-spin text-purple-500" />{s}
              </div>
            ))}
            <p className="text-[11px] text-purple-400 text-center pt-1">2 recherches parallèles en cours...</p>
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